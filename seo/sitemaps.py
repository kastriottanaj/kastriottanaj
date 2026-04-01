from django.contrib.sitemaps import Sitemap
from django.conf import settings
from blog.models import Post
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
        return ['/', '/about', '/services', '/blog', '/portfolio', '/contact']

    def location(self, item):
        return item


class BlogSitemap(BaseSitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Post.objects.filter(published=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/blog/{obj.slug}'


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
