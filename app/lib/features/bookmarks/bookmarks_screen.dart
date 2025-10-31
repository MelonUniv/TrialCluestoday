import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/bookmark_provider.dart';
import '../home/models/article.dart';

class BookmarksScreen extends ConsumerWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookmarks = ref.watch(bookmarkProvider).toList(growable: false);

    if (bookmarks.isEmpty) {
      return const Center(
        child: Text('Save an article to see it listed here.'),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final article = bookmarks[index];
        return _BookmarkTile(article: article);
      },
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemCount: bookmarks.length,
    );
  }
}

class _BookmarkTile extends StatelessWidget {
  const _BookmarkTile({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      tileColor: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      title: Text(article.title),
      subtitle: Text(
        article.body,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}
