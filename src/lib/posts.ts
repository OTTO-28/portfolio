import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Editorial order is shared by the index and article navigation. */
export async function getPosts(): Promise<Post[]> {
  return (await getCollection('blog')).sort(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id),
  );
}

export function getArtwork(post: Post) {
  return (
    post.data.artwork ?? (post.data.category === 'Music' ? 'music' : 'voice')
  );
}
