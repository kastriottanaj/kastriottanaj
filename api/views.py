import logging
import threading

import requests
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import EmailMessage
from django.conf import settings

logger = logging.getLogger(__name__)

from blog.models import Post, Category, Tag
from portfolio.models import Service, Project, Testimonial
from contact.models import ContactMessage
from .serializers import (
    PostListSerializer, PostDetailSerializer, CategorySerializer, TagSerializer,
    ServiceSerializer, ProjectListSerializer, ProjectDetailSerializer,
    TestimonialSerializer, ContactMessageSerializer,
)


# Blog
class PostListView(generics.ListAPIView):
    serializer_class = PostListSerializer

    def get_queryset(self):
        queryset = Post.objects.filter(published=True).prefetch_related('tags').select_related('category')
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__slug=tag)
        return queryset.distinct()


class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.filter(published=True).prefetch_related('tags').select_related('category')
    serializer_class = PostDetailSerializer
    lookup_field = 'slug'


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None


class TagDetailView(generics.RetrieveAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = 'slug'


# Portfolio
class ServiceListView(generics.ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    pagination_class = None


class ProjectListView(generics.ListAPIView):
    serializer_class = ProjectListSerializer

    def get_queryset(self):
        queryset = Project.objects.all()
        featured = self.request.query_params.get('featured')
        if featured:
            queryset = queryset.filter(featured=True)
        return queryset


class ProjectDetailView(generics.RetrieveAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectDetailSerializer
    lookup_field = 'slug'


class TestimonialListView(generics.ListAPIView):
    serializer_class = TestimonialSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = Testimonial.objects.all()
        featured = self.request.query_params.get('featured')
        if featured:
            queryset = queryset.filter(featured=True)
        return queryset


# Contact
class ContactCreateView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Save to DB (non-blocking if it fails)
        try:
            serializer.save()
        except Exception as e:
            logger.error(f'DB save failed: {e}')

        # Run notification email + MailerLite push in background to avoid Gunicorn timeout
        def _process_lead():
            lead_name = data.get('name', '').strip()
            lead_email = data.get('email', '').strip()
            lead_company = data.get('company', '').strip()
            lead_subject = data.get('subject', 'Contact Form')
            lead_message = data.get('message', '')

            # 1. Notification to Kastriot with Reply-To set to lead
            recipient = getattr(settings, 'CONTACT_EMAIL', 'kastriot.sym@gmail.com')
            sender = getattr(settings, 'EMAIL_HOST_USER', '')
            if sender:
                try:
                    notification = EmailMessage(
                        subject=f'[kastriottanaj.com] {lead_subject}',
                        body=(
                            f'From: {lead_name} ({lead_email})\n'
                            f'Company: {lead_company}\n\n'
                            f'{lead_message}'
                        ),
                        from_email=sender,
                        to=[recipient],
                        reply_to=[lead_email] if lead_email else None,
                    )
                    notification.send(fail_silently=False)
                    logger.info(f'Notification sent to {recipient} for lead {lead_email}')
                except Exception as e:
                    logger.error(f'Notification send failed: {e}')

            # 2. Push lead into MailerLite group → triggers automation
            api_key = getattr(settings, 'MAILERLITE_API_KEY', '')
            group_id = getattr(settings, 'MAILERLITE_GROUP_ID', '')
            if api_key and group_id and lead_email:
                try:
                    response = requests.post(
                        'https://connect.mailerlite.com/api/subscribers',
                        headers={
                            'Authorization': f'Bearer {api_key}',
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        json={
                            'email': lead_email,
                            'fields': {
                                'name': lead_name,
                                'company': lead_company,
                            },
                            'groups': [group_id],
                            'status': 'active',
                        },
                        timeout=10,
                    )
                    if response.ok:
                        logger.info(f'MailerLite: subscribed {lead_email} to group {group_id}')
                    else:
                        logger.error(f'MailerLite push failed: {response.status_code} {response.text}')
                except Exception as e:
                    logger.error(f'MailerLite push error: {e}')

        threading.Thread(target=_process_lead, daemon=True).start()

        return Response({'message': 'Message sent successfully.'}, status=status.HTTP_201_CREATED)
