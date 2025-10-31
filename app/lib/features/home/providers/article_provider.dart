import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/article.dart';

final dioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(baseUrl: 'https://jsonplaceholder.typicode.com'));
});

final articlesProvider = FutureProvider<List<Article>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get<List<dynamic>>('/posts', queryParameters: {'_limit': 10});
  final data = response.data ?? [];
  return data
      .map((json) => Article.fromJson(json as Map<String, dynamic>))
      .toList(growable: false);
});
