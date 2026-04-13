from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='post',
            old_name='tags',
            new_name='legacy_tags',
        ),
        migrations.AlterField(
            model_name='post',
            name='legacy_tags',
            field=models.CharField(blank=True, help_text='Deprecated: migrated into Tag model', max_length=500),
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=60)),
                ('slug', models.SlugField(max_length=60, unique=True)),
                ('description', models.TextField(blank=True, help_text='Short description used on /blog/tag/<slug>/ pages for SEO')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='post',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='posts', to='blog.tag'),
        ),
    ]
