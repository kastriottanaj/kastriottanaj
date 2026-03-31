from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # Blog
    path('posts/', views.PostListView.as_view(), name='post-list'),
    path('posts/<slug:slug>/', views.PostDetailView.as_view(), name='post-detail'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    # Portfolio
    path('services/', views.ServiceListView.as_view(), name='service-list'),
    path('projects/', views.ProjectListView.as_view(), name='project-list'),
    path('projects/<slug:slug>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('testimonials/', views.TestimonialListView.as_view(), name='testimonial-list'),
    # Contact
    path('contact/', views.ContactCreateView.as_view(), name='contact-create'),
]
