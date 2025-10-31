import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/bookmark_provider.dart';
import 'models/article.dart';
import 'providers/article_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articles = ref.watch(articlesProvider);
    final bookmarks = ref.watch(bookmarkProvider);

    return articles.when(
      data: (items) => RefreshIndicator(
        onRefresh: () async {
          await ref.refresh(articlesProvider.future);
        },
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final article = items[index];
            final isBookmarked = bookmarks.contains(article);
            return _ArticleTile(
              article: article,
              isBookmarked: isBookmarked,
              onBookmark: () => ref.read(bookmarkProvider.notifier).toggleBookmark(article),
            );
          },
        ),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Failed to load articles',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(error.toString()),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.refresh(articlesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ArticleTile extends StatelessWidget {
  const _ArticleTile({
    required this.article,
    required this.isBookmarked,
    required this.onBookmark,
  });

  final Article article;
  final bool isBookmarked;
  final VoidCallback onBookmark;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              article.title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              article.body,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                icon: Icon(isBookmarked ? Icons.bookmark : Icons.bookmark_border),
                onPressed: onBookmark,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
