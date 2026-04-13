from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0003_migrate_legacy_tags'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='legacy_tags',
        ),
    ]
