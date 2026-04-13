from django.db import migrations
from django.utils.text import slugify


def migrate_legacy_tags(apps, schema_editor):
    Post = apps.get_model('blog', 'Post')
    Tag = apps.get_model('blog', 'Tag')

    for post in Post.objects.exclude(legacy_tags='').exclude(legacy_tags__isnull=True):
        names = [t.strip() for t in post.legacy_tags.split(',') if t.strip()]
        for name in names:
            slug = slugify(name)
            if not slug:
                continue
            tag, _ = Tag.objects.get_or_create(slug=slug, defaults={'name': name})
            post.tags.add(tag)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0002_tag_rename_legacy_tags'),
    ]

    operations = [
        migrations.RunPython(migrate_legacy_tags, reverse_noop),
    ]
