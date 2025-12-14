# Relay App

Do you moderate a subreddit where the team regularly needs to publish official announcements, rule updates, AMAs, or monthly stickies, but you don’t want to rely on a shared mod account or endless copy-paste?

**Relay App** lets moderators draft and publish official **posts** and **comments** in a fast and consistent manner with a clear audit trail!

---

## ✅ What Relay App can do

- **Publish official mod posts** (text only) with one-click **Sticky** and **Lock** options.
- **Publish official mod comments** (text only) with one-click **Sticky** and **Lock** options.
- **Automatic Distinguishing** for mod posts and comments to clearly identify them as mod team communications.
- **Automatic internal mod note** after each publish, showing **who** posted/commented and linking directly to the post/comment.
- **Modmail notifications (default ON)** on submit **and** on edit of a mod post
  – Useful for long announcements: if someone accidentally removes/overwrites content, you’ll still have the copy in modmail.
- **Discord notifications (optional)** via webhook URL
  - **Note:** Very long posts can hit Discord payload limits and may fail to deliver!
- **Auto-flair (optional)**
  - **After posting:** apply a chosen post flair (e.g., _Mod Post_).
  - **After commenting:** when a **mod comments via Relay App**, automatically change post flair (e.g., _Mods Replied_).

- **Templates** — define reusable title/body snippets (any language).
  - **Note:** Up to **3 templates** can be created per subreddit.
- **Permanent delete** of posts/comments created via the app (not just “remove”).

> **Coming soon:** **Post scheduling** (publish at a set time) & **Event reminders** (subscribe to a draft → get a Reddit PM when it’s time)

---

## What's New?

### Lock posts/comments

Functionality has been implemented to allow locking of Relay App posts/comments.

---

## 🛠️ Getting Started

Relay App is quick and easy to set up in your subreddit! Follow these steps to get it running:

### Install & Configure

1. **Install Relay App**
	- Go to the [Relay App](https://developers.reddit.com/apps/relay-app) developer page and click **Add to community**.
	- Select the subreddit where you want install Relay App.
2. **Grant Permissions**
	- Approve the requested permissions when prompted.
3. **Configure your settings**
	- In the settings panel, configure the settings for modmail notifications, Discord notifications, post flairs, and templates. See the sections below for more details on configuration.
4. (Optional) In Relay App settings, add a **Discord webhook** if you want Discord alerts.
5. (Optional) Configure **Auto-flair**:
   - _Enable auto-flair after posting_ → pick label (e.g., _Mod Post_).
   - _Enable auto-flair after commenting_ → pick label (e.g., _Mods Replied_).

### Publish a mod post

1. Using the main subreddit menu (on desktop and mobile), open **Relay App → New Post**.
2. Start from scratch **or** click **Use template** (see Templates below).
3. Toggle **Sticky** / **Lock** as needed.
4. **Publish.**
   - An **internal mod note** is added automatically (actor + direct link).
   - A **modmail** message is sent **by default** (on submit and on later edits).

### Publish a mod comment

1. Using the mod actions menu (on desktop) or the post menu (on mobile), open **Relay App → New Comment**.
2. Write the comment, toggle **Sticky** / **Lock** as needed, then **Publish**.
3. If "auto-flair after commenting" is enabled, the post flair updates automatically.

### Respond with a mod comment

1. 1. Using the mod actions menu (on desktop) or the comment menu (on mobile) for the comment you wish to reply to, open **Relay App → New Comment**.
2. Write the comment, toggle **Sticky** / **Lock** as needed, then **Publish**.
3. If "auto-flair after commenting" is enabled, the post flair updates automatically.

### Delete content created by the app

- Use **Relay App → Delete** to **permanently delete** the app’s post/comment.

  > This is irreversible, so use it carefully!

---

## 🎨 Templates

- Add/edit templates in app settings:
  `https://developers.reddit.com/r/YOUR_SUBREDDIT/apps/relay-app`
- You can store **up to 3** per subreddit.
- In the Relay App menu choose **Use template** to prefill **Title** and **Body**; you can still edit before publishing.
- Works with **any language/locale** (great for AMA announcements, rules changes, monthly stickies).

---

## 🔁 Clone Post (quick reuse)

Need to refresh a monthly sticky or re-run an AMA post? Use **Clone** to copy any existing post into a new draft and update only what changed.

**How it works**

1. Open **Relay App → Posts** (or the post’s context in the app) and click **Clone** on the post you want to reuse.
2. That's it. App has created a new post with the same title, body, and options (sticky, distinguish, etc.). The internal **mod note** and **modmail** include a link back to the original post and a short change summary.

---

## 🔔 Notifications & Logs

- **Modmail (default ON):** sent on **submit** and on **edit** for mod posts. Keeps a durable copy for the team.
- **Discord (optional):** posts to your configured webhook (subject to Discord limits).
- **Internal mod notes:** created automatically after publishing, with the actor and direct link.

---

## 🔒 Mods Only

- Manage Relay App options in **Dev Settings** (templates, auto-flair, Discord webhook, defaults).
- All content remains subject to your subreddit’s rules and Reddit policies.

---

## 📚 Resources

- [Terms & Conditions](https://www.reddit.com/mod/RelayAppDevvit/wiki/relay-app/terms-and-conditions)
- [Privacy Policy](https://www.reddit.com/mod/RelayAppDevvit/wiki/relay-app/privacy-policy)

---

## 🧾 Source & License

The source code for the Relay App is available on [GitHub](https://github.com/ItsNovrix/relay-app).

This project is licensed under the [BSD-3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
This app was developed in compliance with [Reddit's Developer Terms](https://developers.reddit.com/apps/relay-app/developer-settings) and adheres to the guidelines for the Devvit platform.

---

## 🆘 Feedback & Support

If you have any feedback/suggestions or need support, feel free to message [u/ItsNovrix](https://www.reddit.com/u/ItsNovrix) or visit [r/RelayApp](https://www.reddit.com/r/RelayApp).

---

## Changelog

* v0.0.1: Code forked from original app. App name updated.
* v0.0.2: Implemented functionality to allow locking of Relay App posts/comments.
* v0.0.3: Corrected minor errors in post locking code, updated ReadMe. Launched app to public.
* v0.0.4: Corrected minor errors in ReadMe.
* v0.0.5: Corrected minor error with Reddit Developer Terms link.
* v0.0.6: Corrected minor error with resources links.
* v0.0.7: Additional clean up in ReadMe.

Thanks for using **Relay App** — publish faster, safer, and without shared accounts!
