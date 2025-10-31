import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/home/models/article.dart';

class BookmarkNotifier extends StateNotifier<Set<Article>> {
  BookmarkNotifier() : super({});

  void toggleBookmark(Article article) {
    if (state.contains(article)) {
      state = {...state}..remove(article);
    } else {
      state = {...state, article};
    }
  }
}

final bookmarkProvider = StateNotifierProvider<BookmarkNotifier, Set<Article>>(
  (ref) => BookmarkNotifier(),
);
