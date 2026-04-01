from rest_framework import serializers
from blog.models import Post, Category
from portfolio.models import Service, Project, Testimonial
from contact.models import ContactMessage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']


class PostListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image',
            'category', 'tags', 'meta_title', 'meta_description',
            'created_at', 'updated_at',
        ]


class PostDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'featured_image',
            'category', 'tags', 'meta_title', 'meta_description',
            'canonical_url', 'focus_keyword', 'created_at', 'updated_at',
        ]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'title', 'slug', 'description', 'icon', 'meta_title', 'meta_description']


class ProjectListSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'client', 'description',
            'featured_image', 'service', 'featured', 'created_at',
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'client', 'description', 'results',
            'featured_image', 'url', 'service', 'meta_title',
            'meta_description', 'created_at', 'updated_at',
        ]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'role', 'company', 'content', 'avatar', 'rating']


class ContactMessageSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'company', 'subject', 'message']
