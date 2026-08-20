# Socket Events Documentation

# Connection

## `connection`

Triggered whenever a client connects to the Socket.IO server.

### Server Actions

- Reads the authenticated user's username from `socket.user.username`.
- Joins the user's private room:

```text
user:<username>
```

- Broadcasts the latest online users list.
- Registers all socket event listeners.

---

# Presence Events

## `users:online`

Server → Clients

Broadcasts the list of currently connected users.

### Payload

```ts
string[]
```

Example

```ts
[
  "alice",
  "bob",
  "charlie"
]
```

---

# Chat Events

## `chat:send`

Client → Server

Sends a chat message.

### Payload

```ts
{
    // Any chat message object
}
```

### Server Action

Broadcasts the message to every connected client except the sender.

### Emits

Event

```text
chat:receive
```

Payload

```ts
data
```

---

## `chat:receive`

Server → Clients

Receives a chat message sent by another user.

### Payload

```ts
{
    // Same message object sent by sender
}
```

---

# Call Events

## `call:create`

Client → Server

Creates a new call.

### Payload

None

### Server Actions

- Generates a unique `callId`.
- Creates a new call.
- Sets the creator as host.
- Adds creator as first participant.
- Joins room:

```text
call:<callId>
```

- Stores current call ID in:

```ts
socket.data.callId
```

### Emits

To creator

Event

```text
call:created
```

Payload

```ts
{
    callId: string
}
```

---

## `call:invite`

Client → Server

Invites another user into an existing call.

### Payload

```ts
{
    to: string,
    callId: string
}
```

### Server Actions

Sends an invitation to the target user.

### Emits

To

```text
user:<to>
```

Event

```text
call:invited
```

Payload

```ts
{
    from: string,
    callId: string
}
```

Also emits

Event

```text
audio:play
```

Payload

```ts
{
    track: "call-invite"
}
```

---

## `call:invited`

Server → Client

Sent when another user invites you into a call.

### Payload

```ts
{
    from: string,
    callId: string
}
```

---

## `audio:play`

Server → Client

Requests the client to play a sound.

### Payload

```ts
{
    track: "call-invite"
}
```

---

## `call:join`

Client → Server

Joins an existing call.

### Payload

```ts
{
    callId: string
}
```

### Server Actions

- Adds user to participants.
- Joins the call room.
- Stores current call ID.

### Emits (Joining User)

Event

```text
call:joined
```

Payload

```ts
{
    existingUsers: string[]
}
```

### Emits (Everyone in Call)

Event

```text
call:update
```

Payload

```ts
{
    participants: string[]
}
```

---

## `call:joined`

Server → Client

Sent to the user after successfully joining a call.

### Payload

```ts
{
    existingUsers: string[]
}
```

---

## `call:update`

Server → Clients

Sent whenever participants join, leave, or are removed.

### Payload

```ts
{
    participants: string[]
}
```

---

## `call:reject`

Client → Server

Rejects an incoming call invitation.

### Payload

```ts
{
    callerId: string
}
```

### Emits

To

```text
user:<callerId>
```

Event

```text
call:rejected
```

Payload

```ts
{
    rejectedBy: string
}
```

---

## `call:rejected`

Server → Client

Notifies the caller that the invitation was rejected.

### Payload

```ts
{
    rejectedBy: string
}
```

---

## `call:end`

Client → Server

Leaves the current call.

### Payload

None

### Server Actions

- Removes participant.
- Transfers host if necessary.
- Leaves call room.
- Clears `socket.data.callId`.
- Deletes the call if no participants remain.

### Emits

Event

```text
peer:left
```

Payload

```ts
{
    peer: string,
    reason: "left"
}
```

Also emits

```text
call:update
```

Payload

```ts
{
    participants: string[]
}
```

---

## `call:kick`

Client → Server

Removes a participant from the call.

Only the host may perform this action.

### Payload

```ts
{
    callId: string,
    peer: string
}
```

### Server Actions

- Removes the participant.
- Forces the participant's sockets to leave the call room.

### Emits

Event

```text
peer:left
```

Payload

```ts
{
    peer: string,
    reason: "kicked"
}
```

Also emits

```text
call:update
```

Payload

```ts
{
    participants: string[]
}
```

---

## `peer:left`

Server → Clients

Sent whenever a participant leaves or is removed.

### Payload

```ts
{
    peer: string,
    reason: "left" | "kicked"
}
```

---

# WebRTC Signaling Events

## `offer`

Client → Server

Sends a WebRTC offer.

### Payload

```ts
{
    to: string,
    offer: RTCSessionDescriptionInit
}
```

### Emits

To

```text
user:<to>
```

Event

```text
offer
```

Payload

```ts
{
    from: string,
    offer: RTCSessionDescriptionInit
}
```

---

## `answer`

Client → Server

Sends a WebRTC answer.

### Payload

```ts
{
    to: string,
    answer: RTCSessionDescriptionInit
}
```

### Emits

To

```text
user:<to>
```

Event

```text
answer
```

Payload

```ts
{
    from: string,
    answer: RTCSessionDescriptionInit
}
```

---

## `ice`

Client → Server

Exchanges ICE candidates during WebRTC negotiation.

### Payload

```ts
{
    to: string,
    candidate: RTCIceCandidateInit
}
```

### Emits

To

```text
user:<to>
```

Event

```text
ice
```

Payload

```ts
{
    from: string,
    candidate: RTCIceCandidateInit
}
```

---

# Event Summary

| Event | Direction | Payload | Emits |
|--------|-----------|---------|-------|
| `users:online` | Server → Clients | `string[]` | Online users |
| `chat:send` | Client → Server | `data` | `chat:receive` |
| `chat:receive` | Server → Clients | `data` | Chat message |
| `call:create` | Client → Server | None | `call:created` |
| `call:created` | Server → Client | `{ callId }` | Call created |
| `call:invite` | Client → Server | `{ to, callId }` | `call:invited`, `audio:play` |
| `call:invited` | Server → Client | `{ from, callId }` | Incoming call invitation |
| `audio:play` | Server → Client | `{ track }` | Play ringtone |
| `call:join` | Client → Server | `{ callId }` | `call:joined`, `call:update` |
| `call:joined` | Server → Client | `{ existingUsers }` | Joined successfully |
| `call:update` | Server → Clients | `{ participants }` | Participants updated |
| `call:reject` | Client → Server | `{ callerId }` | `call:rejected` |
| `call:rejected` | Server → Client | `{ rejectedBy }` | Invitation rejected |
| `offer` | Client → Server | `{ to, offer }` | `offer` |
| `answer` | Client → Server | `{ to, answer }` | `answer` |
| `ice` | Client → Server | `{ to, candidate }` | `ice` |
| `call:end` | Client → Server | None | `peer:left`, `call:update` |
| `call:kick` | Client → Server | `{ callId, peer }` | `peer:left`, `call:update` |
| `peer:left` | Server → Clients | `{ peer, reason }` | Participant left or kicked |