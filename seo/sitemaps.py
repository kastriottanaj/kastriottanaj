from django.contrib.sitemaps import Sitemap
from django.conf import settings
from blog.models import Post, Tag
from portfolio.models import Project, Service


class SiteDomain:
    def __init__(self, domain):
        self.domain = domain
        self.name = domain


class BaseSitemap(Sitemap):
    protocol = 'https'

    def get_urls(self, site=None, **kwargs):
        site = SiteDomain(settings.SITE_DOMAIN)
        return super().get_urls(site=site, **kwargs)


class StaticSitemap(BaseSitemap):
    changefreq = 'weekly'
    priority = 1.0

    def items(self):
        return ['/', '/about', '/services', '/blog', '/portfolio', '/contact', '/privacy']

    def location(self, item):
        return item

    def get_priority(self, item):
        return 0.3 if item == '/privacy' else 1.0


class BlogSitemap(BaseSitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Post.objects.filter(published=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/blog/{obj.slug}'


class BlogTagSitemap(BaseSitemap):
    changefreq = 'weekly'
    priority = 0.6

    def items(self):
        return Tag.objects.filter(posts__published=True).distinct()

    def location(self, obj):
        return f'/blog/tag/{obj.slug}'


class ProjectSitemap(BaseSitemap):
    changefreq = 'monthly'
    priority = 0.7

    def items(self):
        return Project.objects.all()

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/portfolio/{obj.slug}'


class ServiceSitemap(BaseSitemap):
    changefreq = 'monthly'
    priority = 0.9

    def items(self):
        return Service.objects.all()

    def location(self, obj):
        return f'/services/{obj.slug}'
