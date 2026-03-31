from django.http import HttpResponse
from django.conf import settings


def robots_txt(request):
    lines = [
        'User-agent: *',
        'Allow: /',
        '',
        f'Sitemap: https://{settings.SITE_DOMAIN}/sitemap.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')
