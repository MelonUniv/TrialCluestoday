import 'package:equatable/equatable.dart';

class Article extends Equatable {
  const Article({required this.id, required this.title, required this.body});

  final int id;
  final String title;
  final String body;

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'] as int,
      title: json['title'] as String,
      body: json['body'] as String,
    );
  }

  @override
  List<Object?> get props => [id, title, body];
}
