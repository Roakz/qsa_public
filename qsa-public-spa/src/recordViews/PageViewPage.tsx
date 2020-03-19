import React, {useState, useEffect} from 'react';
import { Http } from '../utils/http';
import { Redirect } from 'react-router';
import Layout from './Layout';

import { ClientState } from '../context/AppContext';
import { PageRoute } from '../models/PageRoute';


export const PageSnippet: React.FC<any> = (props: any) => {
  const [content, setContent] = useState('');
  const [followLink, setFollowLink] = useState('');

  useEffect(() => {
    if (props.slug) {
      if (props.forceLoad) {
        ClientState.refreshNonce();
      }

      Http.get().getPageContent(props.slug, ClientState.nonce)
          .then((content: string) => {
            setContent(content);
            if (props.successCallback) {
              props.successCallback();
            }
          })
          .catch((error: any) => {
            if (props.notFoundCallback) {
              props.notFoundCallback();
            }
          });
    }
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [props.slug]);

  useEffect(() => {
    document.querySelectorAll('.qsa-snippet-text a').forEach((link: Element) => {
      const a = link as HTMLAnchorElement;

      if (!a.getAttribute('data-rr-link')) {
        const href = a.getAttribute('href') || '';

        if (href.startsWith("/pages") &&
          a.target !== '_blank') {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            setFollowLink(href);
          });
        }
        a.setAttribute('data-rr-link', 'true');
      }
    });

    const maxIterations = 1000;

    for (let i = 0; i < maxIterations; i++) {
      const codeBlock = document.querySelector('.qsa-snippet-text p > code');

      if (!codeBlock) {
        break;
      }

      let combinedHTML = (codeBlock as HTMLElement).innerText;

      // If there are other adjacent <p><code> blocks following this one, combined them into one chunk.
      let adjacentBlock = codeBlock.parentNode && codeBlock.parentNode.nextSibling as HTMLElement;

      while (adjacentBlock &&
        adjacentBlock.childElementCount === 1 &&
        adjacentBlock.firstChild &&
        (adjacentBlock.firstChild as HTMLElement).tagName === 'CODE') {
        const nextAdjacentBlock = adjacentBlock.nextSibling;

        combinedHTML += (adjacentBlock.firstChild as HTMLElement).innerText;

        if (adjacentBlock.parentNode) {
          adjacentBlock.parentNode.removeChild(adjacentBlock);
        }

        adjacentBlock = nextAdjacentBlock as HTMLElement;
      }

      // Once we reach the end of our run, insert our code.
      if (codeBlock.parentNode) {
        (codeBlock.parentNode as HTMLElement).outerHTML = combinedHTML;
      }
    }
  });

  if (followLink) {
    return <Redirect to={followLink} push={true} />;
  } else {
    return <div className="qsa-snippet-text" dangerouslySetInnerHTML={{__html: (props.content || content)}} />
  }
}

const PageViewPage: React.FC<PageRoute> = (route: PageRoute) => {
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const firstChild = document.querySelector('.page-content h1');

    if (firstChild) {
      route.setPageTitle((firstChild as HTMLElement).innerText || '');
      route.triggerPageViewTracker();
    }
  }, [loaded, route]);

  if (notFound) {
    return <Redirect to="/404" push={true} />;
  }

  return (
    <Layout>
      <div className="page-content">
        <PageSnippet
          forceLoad={true}
          slug={route.match.params.slug}
          successCallback={() => setLoaded(true)}
          notFoundCallback={() => setNotFound(true)}
        />
      </div>
    </Layout>
  );
};

export default PageViewPage;
