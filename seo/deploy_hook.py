import logging
import threading
from urllib import request, error

from django.conf import settings

logger = logging.getLogger(__name__)


def _post(url):
    try:
        req = request.Request(url, method='POST', data=b'')
        with request.urlopen(req, timeout=10) as resp:
            logger.info('Render deploy hook fired: HTTP %s', resp.status)
    except error.URLError as exc:
        logger.warning('Render deploy hook failed: %s', exc)
    except Exception:
        logger.exception('Render deploy hook raised unexpectedly')


def trigger_frontend_rebuild(reason=''):
    url = getattr(settings, 'RENDER_DEPLOY_HOOK_URL', '')
    if not url:
        logger.debug('RENDER_DEPLOY_HOOK_URL not set; skipping rebuild trigger (%s)', reason)
        return
    logger.info('Triggering frontend rebuild: %s', reason)
    threading.Thread(target=_post, args=(url,), daemon=True).start()
