from django.contrib.sitemaps import Sitemap
from django.conf import settings
from blog.models import Post
from portfolio.models import Project, Service


class StaticSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 1.0
    protocol = 'https'

    def items(self):
        return ['/', '/about', '/services', '/blog', '/portfolio', '/contact']

    def location(self, item):
        return item


class BlogSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8
    protocol = 'https'

    def items(self):
        return Post.objects.filter(published=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/blog/{obj.slug}'


class ProjectSitemap(Sitemap):
    changefreq = 'monthly'
    priority = 0.7
    protocol = 'https'

    def items(self):
        return Project.objects.all()

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/portfolio/{obj.slug}'


class ServiceSitemap(Sitemap):
    changefreq = 'monthly'
    priority = 0.9
    protocol = 'https'

    def items(self):
        return Service.objects.all()

    def location(self, obj):
        return f'/services/{obj.slug}'
