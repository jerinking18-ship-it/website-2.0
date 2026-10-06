# Support Chat Flow Plan

## Goal

Define the customer support chat system for the grocery ecommerce platform.

The support system should allow customers to communicate with the business through a website chatbox, while support agents respond from the admin panel.

The system should support:

- Customer chatbox.
- Admin support inbox.
- Realtime WebSocket messaging.
- Email notifications.
- WhatsApp notifications.
- SMS notifications.
- Agent assignment.
- Unread counts.
- Open, pending, and resolved states.
- Conversation history.
- Order context.

## Support Principles

- Customers should be able to ask for help before or after placing an order.
- Support should be available globally from the customer website.
- Admin agents should have enough context to answer quickly.
- Messages should be stored permanently.
- Realtime chat should work when both sides are online.
- Notifications should cover offline or delayed responses.
- Support agents should only see conversations they are allowed to access.

## Customer Chatbox

### Placement

- Bottom-right on desktop.
- Bottom area on mobile.
- Must not block the cart drawer or checkout buttons.

### Customer Chatbox States

- Closed floating button.
- Welcome state.
- New conversation state.
- Active conversation state.
- Waiting for agent state.
- Resolved conversation state.
- Offline/error state.

### Customer Chatbox Features

- Start conversation.
- Send message.
- Receive message.
- Typing indicator.
- Message delivery status.
- Message read status.
- Show conversation history.
- Quick topic buttons.
- Link conversation to order.
- Attachment placeholder for later.

### Suggested Quick Topics

- Where is my order?
- Change delivery slot.
- Missing item.
- Payment issue.
- Product question.
- Refund or replacement.

## Admin Support Inbox

### Layout

Use a 3-column support layout:

1. Conversation list.
2. Chat thread.
3. Customer and order context panel.

### Conversation List

Should show:

- Customer name or phone.
- Last message.
- Last message time.
- Unread count.
- Conversation status.
- Assigned agent.
- Order number if linked.

Filters:

- Open.
- Pending.
- Resolved.
- Assigned to me.
- Unassigned.
- Order-related.

### Chat Thread

Should include:

- Customer messages.
- Agent messages.
- System events.
- Timestamps.
- Read status.
- Typing indicator.
- Quick replies.
- Internal note placeholder later.

### Context Panel

Should show:

- Customer profile.
- Phone number.
- Email if available.
- Recent orders.
- Linked order details.
- Delivery slot.
- Payment status.
- Order status.
- Previous conversations.

## Conversation Lifecycle

### Open

Conversation is active and needs support attention.

### Pending

Conversation is waiting for customer response, internal action, or order update.

### Resolved

Conversation is completed.

Resolved conversations can be reopened if the customer replies again.

## Conversation Flow

1. Customer opens chatbox.
2. Customer selects topic or types message.
3. System creates support conversation.
4. System stores message.
5. Admin support inbox updates in realtime.
6. Agent accepts or is assigned conversation.
7. Agent replies.
8. Customer receives realtime reply.
9. Conversation can be marked pending or resolved.
10. Notifications are sent when needed.

## Assignment Flow

Support conversations can be:

- Unassigned.
- Assigned manually.
- Auto-assigned later.

Manual assignment:

1. Agent or manager opens conversation.
2. Agent assigns conversation to self or another agent.
3. Conversation updates in realtime.
4. Audit/event record is created.

## Realtime WebSocket Events

### Customer Events

- `support:connect`
- `support:start_conversation`
- `support:send_message`
- `support:typing_started`
- `support:typing_stopped`
- `support:mark_read`

### Admin Events

- `support:join_inbox`
- `support:join_conversation`
- `support:send_message`
- `support:assign_conversation`
- `support:mark_pending`
- `support:resolve_conversation`
- `support:typing_started`
- `support:typing_stopped`
- `support:mark_read`

### Server Broadcast Events

- `support:conversation_created`
- `support:message_received`
- `support:message_delivered`
- `support:message_read`
- `support:conversation_assigned`
- `support:conversation_pending`
- `support:conversation_resolved`
- `support:unread_count_updated`
- `support:agent_typing`
- `support:customer_typing`

## Notification Rules

Notifications should be sent through:

- Email.
- WhatsApp.
- SMS.

### Notify Admins When

- New conversation starts.
- Customer sends message and no agent is online.
- Conversation remains unassigned too long.
- Customer replies to pending conversation.

### Notify Customer When

- Agent replies while customer is offline.
- Conversation is marked pending with note.
- Conversation is resolved.
- Order-related support update is available.

## Notification Priority

Recommended priority:

1. Realtime WebSocket if online.
2. Email for non-urgent message records.
3. WhatsApp for important customer updates.
4. SMS for urgent or fallback notifications.

## Unread Counts

Unread counts should be tracked for:

- Customer unread messages.
- Agent unread messages.
- Admin inbox total unread.
- Assigned-to-me unread.

Redis can be used for fast unread counters, while PostgreSQL stores source-of-truth read receipts.

## Support Message Types

Recommended message types:

- Text.
- System event.
- Quick reply.
- Attachment placeholder.
- Order reference.
- Internal note later.

## Support Conversation Events

Store system events such as:

- Conversation started.
- Message sent.
- Agent assigned.
- Conversation marked pending.
- Conversation resolved.
- Conversation reopened.
- Order linked.

## Order-Linked Support

Support should link to orders when relevant.

Order-linked support can start from:

- Order detail page.
- Order confirmation page.
- Admin order detail page.
- Customer chatbox quick topic.

Support agents should see:

- Order number.
- Order status.
- Payment status.
- Delivery slot.
- Delivery address summary.
- Items.

## Permissions

Support agent permissions:

- View support inbox.
- Reply to conversations.
- Mark conversations pending.
- Resolve conversations.
- Use quick replies.

Manager permissions:

- Assign conversations.
- Reassign conversations.
- View all support agents.
- Manage quick replies.

Owner permissions:

- Full support access.
- View audit logs.
- Configure notification channels.

## Error States

Customer errors:

- Message failed to send.
- Support temporarily unavailable.
- Conversation not found.
- Attachment unsupported.

Admin errors:

- Conversation already assigned.
- Agent does not have permission.
- Message failed to send.
- Notification failed.

Each error should offer a clear retry or next action.

## Data Storage

PostgreSQL stores:

- Support conversations.
- Support messages.
- Attachments.
- Quick replies.
- Conversation events.
- Read receipts.

Redis stores:

- Online presence.
- Typing indicators.
- Unread count cache.
- WebSocket session mapping.

## Admin Dashboard Signals

Support should update:

- Open support chat count.
- Unassigned support count.
- Assigned-to-me count.
- Average response time later.
- Resolved conversations count later.

## Recommended First Implementation Order

1. Support conversation database models.
2. Customer chatbox UI.
3. Admin support inbox UI.
4. Send and receive messages.
5. WebSocket realtime updates.
6. Unread counts.
7. Assignment.
8. Pending and resolved states.
9. Email notifications.
10. WhatsApp notifications.
11. SMS notifications.
12. Order-linked support context.

