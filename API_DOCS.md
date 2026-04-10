# 🚀 Sendme Social App - Full API List

Use these exact URLs in Postman or your code.

## 🔑 Authentication
*All endpoints require Token (except Login/Signup) in Header:* 
`Authorization: Bearer <your_token>`

### 1. Signup
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/auth/signup`
- **Body:** `{ "username": "name", "email": "e@e.com", "password": "123" }`

### 2. Login
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/auth/login`
- **Body:** `{ "email": "e@e.com", "password": "123" }`

### 3. Get Own Profile
- **Method:** `GET`
- **URL:** `http://10.25.164.196:5000/api/auth/profile`

---

## 👤 Friends & Users

### 4. Get Friends List (Chat List)
- **Method:** `GET`
- **URL:** `http://10.25.164.196:5000/api/users`

### 5. Get All System Users
- **Method:** `GET`
- **URL:** `http://10.25.164.196:5000/api/users/all`

### 6. Search a Specific User
- **Method:** `GET`
- **URL:** `http://10.25.164.196:5000/api/users/search?query=@unique_handle`

### 7. Send Friend Request
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/users/friend-request`
- **Body:** `{ "receiverId": "USER_ID" }`

### 8. Accept Friend Request
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/users/accept-request`
- **Body:** `{ "requestId": "REQUEST_ID" }`

### 9. Get Pending Incoming Requests
- **Method:** `GET`
- **URL:** `http://10.25.164.196:5000/api/users/pending-requests`

### 10. Remove Friend (Unfriend)
- **Method:** `DELETE`
- **URL:** `http://10.25.164.196:5000/api/users/friend/USER_ID`

---

## 💬 Chat & Snap

### 11. Get Chat History
- **Method:** `GET`
- **URL:** `http://10.25.164.196:5000/api/chat/TARGET_USER_ID`

### 12. Send Text/Media Message
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/chat`
- **Body:** `{ "receiverId": "ID", "content": "Text/URL", "type": "text/image/video" }`

### 13. Mark as Seen (Disappearing messages)
- **Method:** `PUT`
- **URL:** `http://10.25.164.196:5000/api/chat/seen/SENDER_ID`

---

## 📸 Stories

### 14. Post a New Story
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/stories`
- **Body:** `{ "mediaType": "image", "mediaUrl": "URL_HERE" }`

### 15. Get All Friends' Stories
- **Method:** `GET`
- **URL:** `http://10.25.164.196:5000/api/stories`

---

## 📂 Media Upload (Multipart)

### 16. Upload Image File
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/upload/image`
- **Field:** `image` (binary file)

### 17. Upload Video File
- **Method:** `POST`
- **URL:** `http://10.25.164.196:5000/api/upload/video`
- **Field:** `video` (binary file)

---

## 🟢 Socket.io (Real-time)
- **Connect URL:** `http://10.25.164.196:5000`
