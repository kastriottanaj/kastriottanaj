import os
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


def _serve_txt_file(filename):
    file_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', filename)
    with open(file_path, 'r') as f:
        content = f.read()
    return HttpResponse(content, content_type='text/plain; charset=utf-8')


def llms_txt(request):
    return _serve_txt_file('llms.txt')


def llms_full_txt(request):
    return _serve_txt_file('llms-full.txt')
