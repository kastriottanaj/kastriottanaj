from django.urls import path
from . import views

urlpatterns = [
    path('robots.txt', views.robots_txt, name='robots-txt'),
    path('llms.txt', views.llms_txt, name='llms-txt'),
    path('llms-full.txt', views.llms_full_txt, name='llms-full-txt'),
]
