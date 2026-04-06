import logging
import threading

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

from blog.models import Post, Category
from portfolio.models import Service, Project, Testimonial
from contact.models import ContactMessage
from .serializers import (
    PostListSerializer, PostDetailSerializer, CategorySerializer,
    ServiceSerializer, ProjectListSerializer, ProjectDetailSerializer,
    TestimonialSerializer, ContactMessageSerializer,
)


# Blog
class PostListView(generics.ListAPIView):
    serializer_class = PostListSerializer

    def get_queryset(self):
        queryset = Post.objects.filter(published=True)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset


class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.filter(published=True)
    serializer_class = PostDetailSerializer
    lookup_field = 'slug'


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None


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

        # Send email in background thread to avoid Gunicorn timeout
        def _send_email():
            recipient = getattr(settings, 'CONTACT_EMAIL', 'kastriot.sym@gmail.com')
            sender = getattr(settings, 'EMAIL_HOST_USER', '') or 'noreply@kastriottanaj.com'
            try:
                send_mail(
                    subject=f'[kastriottanaj.com] {data.get("subject", "Contact Form")}',
                    message=(
                        f'From: {data.get("name", "")} ({data.get("email", "")})\n'
                        f'Company: {data.get("company", "")}\n\n'
                        f'{data.get("message", "")}'
                    ),
                    from_email=sender,
                    recipient_list=[recipient],
                    fail_silently=False,
                )
                logger.info(f'Email sent to {recipient} from {data.get("email")}')
            except Exception as e:
                logger.error(f'Email send failed: {e}')

        threading.Thread(target=_send_email, daemon=True).start()

        return Response({'message': 'Message sent successfully.'}, status=status.HTTP_201_CREATED)
