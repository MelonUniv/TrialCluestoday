# Job Topic Publishing Cloud Function

The mobile application subscribes each device token to an FCM topic per preferred state. Topics use the format `<topicPrefix>-<state>`, where the default prefix is `state` (for example `state-california`). The backend must expose a Cloud Function capable of receiving new job postings and pushing them to the appropriate topics.

## HTTP Trigger

Deploy the following function to Firebase Cloud Functions (2nd gen). It expects a JSON payload with the fields `state`, `title`, `id`, `deadline`, and optionally `category`. The function will publish a notification to the state topic and can be extended to target category-specific audiences if needed.

```ts
import { onRequest } from 'firebase-functions/v2/https';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export const publishJobNotification = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  const { state, title, id, deadline, category } = req.body;
  if (!state || !title || !id || !deadline) {
    res.status(400).send({ error: 'Missing required fields' });
    return;
  }

  const topicPrefix = process.env.TOPIC_PREFIX ?? 'state';
  const topic = `${topicPrefix}-${state.toLowerCase().replace(/\s+/g, '-')}`;

  await getMessaging().send({
    topic,
    notification: {
      title: `${title} – New ${category ?? 'job'} opportunity`,
      body: `Apply by ${new Date(deadline).toLocaleDateString()}`
    },
    data: {
      jobId: String(id),
      deadline,
      state,
      category: category ?? 'general'
    }
  });

  res.status(200).send({ status: 'sent', topic });
});
```

## Subscription Endpoint

The mobile app posts to `<notificationServiceUrl>/subscribe` with a body containing `{ token, topics }`. Ensure your backend protects this endpoint by requiring authentication and invoking the Firebase Admin SDK to subscribe the token:

```ts
import { getMessaging } from 'firebase-admin/messaging';

export async function subscribeToTopics(token: string, topics: string[]) {
  await Promise.all(topics.map((topic) => getMessaging().subscribeToTopic(token, topic)));
}
```

Return a 204 status on success to keep the client logic simple.
