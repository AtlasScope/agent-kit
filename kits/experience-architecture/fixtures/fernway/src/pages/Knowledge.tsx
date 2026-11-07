import { Link, useParams } from 'react-router-dom';
import { articles } from '@/data/seed';
import Breadcrumbs from '@/components/Breadcrumbs';
import { articleUrl } from '@/lib/urls';

export function Knowledge() {
  const sections = [...new Set(articles.map((a) => a.section))];
  return (
    <div>
      <h1>Knowledge base</h1>
      <p><Link to="/knowledge/saved-replies">Saved replies</Link></p>
      {sections.map((s) => (
        <section key={s}>
          <h2>{s}</h2>
          <ul className="plain">
            {articles
              .filter((a) => a.section === s)
              .map((a) => (
                <li key={a.slug}>
                  <Link to={articleUrl(a.slug)}>{a.title}</Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function Article() {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);
  if (!article) return <p>Article not found.</p>;
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: 'Knowledge', to: '/knowledge' }, { label: article.title }]} />
      <h1>{article.title}</h1>
      <p>{article.body}</p>
    </div>
  );
}
