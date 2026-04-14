from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from seo.deploy_hook import trigger_frontend_rebuild
from .models import Post, Tag


@receiver(post_save, sender=Post)
def post_saved(sender, instance, **kwargs):
    if instance.published:
        trigger_frontend_rebuild(f'Post saved: {instance.slug}')


@receiver(post_delete, sender=Post)
def post_deleted(sender, instance, **kwargs):
    trigger_frontend_rebuild(f'Post deleted: {instance.slug}')


@receiver(post_save, sender=Tag)
def tag_saved(sender, instance, **kwargs):
    trigger_frontend_rebuild(f'Tag saved: {instance.slug}')


@receiver(post_delete, sender=Tag)
def tag_deleted(sender, instance, **kwargs):
    trigger_frontend_rebuild(f'Tag deleted: {instance.slug}')
