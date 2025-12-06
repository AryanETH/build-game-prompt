# Admin Panel Setup Guide

## Overview
The admin panel allows you to manually upload games with custom HTML code. Only users with the designated admin email can access it.

## Setup Steps

### 1. Set Admin Email

Add this to your `.env` file:

```env
VITE_ADMIN_EMAIL=your-admin-email@example.com
```

**Default:** If not set, it defaults to `admin@oplus.ai`

### 2. Create Admin Account

1. Go to your site's login page: `/auth`
2. Sign up with the admin email you configured
3. Verify your email (check inbox)
4. Log in with the admin credentials

### 3. Access Admin Panel

Once logged in with the admin email, you'll be automatically redirected to `/admin` instead of `/feed`.

**Direct URL:** `https://your-site.com/admin`

---

## Using the Admin Panel

### Upload a New Game

1. **Title** (required): Name of your game
2. **Description**: Brief description of the game
3. **Game Code** (required): Complete HTML code including `<html>`, `<head>`, `<body>` tags
4. **Thumbnail URL**: Image URL for the game thumbnail (400x800 recommended)
5. **Cover URL**: Larger image for the game cover (optional)

Click **Upload Game** to publish.

### Game Code Format

Your game code should be a complete, self-contained HTML document:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
      color: #fff;
      font-family: Arial, sans-serif;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100vh;
    }
  </style>
</head>
<body>
  <canvas id="gameCanvas"></canvas>
  <script>
    // Your game logic here
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Game code...
  </script>
</body>
</html>
```

### Quick Test Game

Here's a simple click counter game you can use to test:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      font-family: Arial, sans-serif;
      flex-direction: column;
      cursor: pointer;
    }
    h1 {
      font-size: 5em;
      margin: 0;
      animation: pulse 1s infinite;
    }
    p {
      font-size: 1.5em;
      opacity: 0.8;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>
</head>
<body>
  <h1 id="score">0</h1>
  <p>Click anywhere to score!</p>
  <script>
    let score = 0;
    document.body.onclick = () => {
      score++;
      document.getElementById('score').textContent = score;
    };
  </script>
</body>
</html>
```

---

## Features

### Upload Form
- Paste complete HTML game code
- Add metadata (title, description, images)
- Instant validation
- One-click publish

### Games Management
- View recently uploaded games
- See game stats (likes, plays, comments)
- Delete games
- Refresh list

### Security
- Only accessible by admin email
- Automatic redirect for non-admin users
- Protected route with authentication check

---

## Image URLs

You can use:
- **Unsplash**: `https://images.unsplash.com/photo-ID?w=400`
- **Your own hosting**: Upload to Supabase Storage or any CDN
- **Placeholder**: `https://via.placeholder.com/400x800`

---

## Troubleshooting

### Can't Access Admin Panel
- Verify your email matches `VITE_ADMIN_EMAIL` in `.env`
- Make sure you're logged in
- Check browser console for errors
- Try logging out and back in

### Game Not Displaying
- Ensure HTML is complete and valid
- Check for JavaScript errors in game code
- Verify all assets (images, sounds) use absolute URLs
- Test game code in a separate HTML file first

### Upload Fails
- Check Supabase connection
- Verify you're authenticated
- Ensure all required fields are filled
- Check browser console for error messages

---

## Best Practices

1. **Test Locally First**: Test your game HTML in a local file before uploading
2. **Use Absolute URLs**: All assets (images, sounds) should use full URLs
3. **Optimize Code**: Minify JavaScript for better performance
4. **Responsive Design**: Make games work on both mobile and desktop
5. **Error Handling**: Include try-catch blocks in your game code
6. **Clean Code**: Comment your code for future reference

---

## Example Games to Upload

### 1. Dino Jump Game
### 2. Snake Game
### 3. Pong Game
### 4. Memory Card Game
### 5. Flappy Bird Clone

Check the `/examples` folder for complete game templates (coming soon).

---

## Support

For issues or questions:
- Email: playgenofficial@gmail.com
- Instagram: @oplus.ai

---

**Happy Game Creating! 🎮**
