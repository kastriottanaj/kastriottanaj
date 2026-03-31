from django.db import models
from django.utils.text import slugify


class Service(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True, help_text='Icon class name (e.g., fa-search)')
    order = models.PositiveIntegerField(default=0)

    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ['order']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    client = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    results = models.TextField(blank=True, help_text='Measurable outcomes and metrics')
    featured_image = models.ImageField(upload_to='portfolio/', blank=True)
    url = models.URLField(blank=True)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, related_name='projects')
    featured = models.BooleanField(default=False)

    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Testimonial(models.Model):
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    company = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    avatar = models.ImageField(upload_to='testimonials/', blank=True)
    rating = models.PositiveIntegerField(default=5)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.company}'
