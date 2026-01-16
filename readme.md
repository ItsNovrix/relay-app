# Relay App

Do you moderate a subreddit where the team regularly needs to publish official announcements, rule updates, AMAs, or monthly stickies, but you don’t want to rely on a shared mod account or endless copy-paste?

**Relay App** is a tool that lets moderators publish official moderator posts/comments in a fast and consistent manner while keeping their individual moderator accounts private!

---

## ✅ What Relay App can do

- **Publish Official Mod Posts** (text only) — With one-click **Sticky** and **Lock** options.
- **Publish Official Mod Comments** (text only) — With one-click **Sticky** and **Lock** options.
- **Post Templates** — Create up to **5 reusable post templates** that can quickly be deployed as needed.
- **Post Scheduling** — Use post templates to automate up to **5 posts** with custom times on a weekly interval.
- **Automatic Distinguishing** — Clearly identify posts and comments as mod team communications.
- **Automatic Internal Mod Note** — Shows user who posted/commented via Relay App and links directly to the post/comment.
- **Audit Trail** — All actions performed using Relay App are logged in the mod log for transparency and a clear audit trail.
- **Modmail Notifications (default ON)** — Receive a modmail notification on submit **and** on edit of a mod post.
- **Discord Notifications (optional)** — Receive notifications in a Discord server on submit **and** on edit of a mod post via webhook URL.
- **Auto-Flair (optional)** — Apply a chosen post flair after submitting a post, or automatically change post flair after replying to a post.
- **Permanent Delete** — Posts/comments created via Relay App can be permantently deleted (not just marked as "removed").

> **Coming Soon:** **Monthly Post Scheduling Intervals** — Enhanced post scheduling functionality to include monthly scheduling option.

---

## What's New?

### Reply notifications

Relay App now includes functionality to notify via modmail when a user replies to a Relay App post or comment.

- Optional toggle to ignore replies from mod accounts.
- Optional functionality to notify for additional specified users (e.g., AutoModerator and -ModTeam accounts).

### Post scheduling

Relay App now includes a scheduling system that allows moderators to automate posts with custom times on a weekly interval.

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

## 🎨 Post Templates

- Add/edit post templates in app settings:
  `https://developers.reddit.com/r/YOUR_SUBREDDIT/apps/relay-app`
- You can store **up to 5** templates per subreddit.
- In the Relay App menu choose **Use template** to prefill **Title** and **Body**; you can still edit before publishing.
- Works with **any language/locale** (great for AMA announcements, rules changes, monthly stickies, etc.).

---

## 📅 Post Scheduling

Relay App features a custom-built scheduling engine designed to overcome the rigid limitations of Reddit's native post scheduler. The scheduling system works in conjunction with the post template system to automate the posting of selected post templates to your subreddit. 

While Reddit's built-in scheduler is a useful tool, it has a few significant constraints:

- Native Reddit scheduling only allows you to automate a total of **2 stickied posts**. If you want more, you have to manually sticky them.

- Because the native system is capped at two automated slots, trying to automate stickied posts or events after the limit has been reached results in bumping off existing stickied posts, requiring moderators to re-sticky posts they still need.

These issues can be quite frustrating for moderators in need of automating more than 2 posts that need to be stickied. Relay App expands your subreddit's prime real estate by leveraging the full 6-post limit of the modern Reddit Community Highlights system.

- Relay App allows you to schedule and automate up to five distinct templates.

- Scheduled posts can be stickied, locked, or both.

- Relay App bypasses Reddit's native post scheduler limit of 2 stickied posts, allowing you to automate up to **5 sticked posts**.

- By capping our template system at five slots, Relay App intentionally leaves one permanent manual slot open. This ensures your mod team always has room to manually sticky an emergency announcement, a breaking news thread, or other post without the app accidentally overwriting it.

> **Coming Soon:** Support for monthly post scheduling intervals.

### Using the Scheduling System

The scheduling system works with the Post Template system to automate subreddit posts. Follow these steps to use it:

1. **Create Post Templates** – Set up your post templates in the app settings.

2. **Enable Scheduling** – Enable scheduling on the templates you want to schedule and specify their timing (All scheduled posts use UTC time).

3. **Activate Scheduled Posts** – In the Subreddit Moderator Context Menu, select **Apply Scheduled Posts** to apply all enabled schedules.

> **Note:** If **"Repeat Weekly?"** is toggled off, posts will not run again unless manually re-applied.

> **Coming Soon:** Support for monthly post scheduling intervals.

---

## 🔁 Clone Post (quick reuse)

Need to refresh a monthly sticky or re-run an AMA post? Use **Clone** to copy any existing post into a new draft and update only what changed.

**How it works**

1. Open **Relay App → Posts** (or the post’s context in the app) and click **Clone** on the post you want to reuse.
2. That's it. App has created a new post with the same title, body, and options (sticky, distinguish, etc.). The internal **mod note** and **modmail** include a link back to the original post and a short change summary.

---

## 🔔 Notifications & Logs

- **Modmail (default ON):** sent on **submit** and on **edit** for mod posts. Keeps a durable copy for the team.
  – Useful for long announcements: if someone accidentally removes/overwrites content, you’ll still have the copy in modmail.
- **Discord (optional):** posts to your configured webhook (subject to Discord limits).
  - **Note:** Very long posts can hit Discord payload limits and may fail to deliver!
- **Internal mod notes:** created automatically after publishing, with the actor and direct link.

---

## 🔒 Mods Only

- Manage Relay App options in **Dev Settings** (templates, auto-flair, Discord webhook, defaults).
- All content remains subject to your subreddit’s rules and Reddit policies.

---

## 📚 Resources

- [Terms & Conditions](https://www.reddit.com/r/RelayLabs/wiki/terms-and-conditions/)
- [Privacy Policy](https://www.reddit.com/r/RelayLabs/wiki/privacy-policy/)

---

## 🧾 Source & License

The source code for the Relay App is available on [GitHub](https://github.com/ItsNovrix/relay-app).

This project is licensed under the [BSD-3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
This app was developed in compliance with [Reddit's Developer Terms](https://developers.reddit.com/apps/relay-app/developer-settings) and adheres to the guidelines for the Devvit platform.

---

## 🆘 Feedback & Support

If you have any feedback/suggestions or need support, visit [r/RelayLabs](https://www.reddit.com/r/RelayLabs).

---

## Changelog

* v0.0.1: Code forked from original app. App name updated.
* v0.0.2: Implemented functionality to allow locking of Relay App posts/comments.
* v0.0.3: Corrected minor errors in post locking code, updated ReadMe. Launched app to public.
* v0.0.4: Corrected minor errors in ReadMe.
* v0.0.5: Corrected minor error with Reddit Developer Terms link.
* v0.0.6: Corrected minor error with resources links.
* v0.0.7: Additional clean up in ReadMe.
* v0.0.8: Implemented scheduling system, updated ReadMe.
* v0.0.9: Updated ReadMe
* v0.0.10: Updated ReadMe and resources links.
* v0.0.11: Implemented reply notifications for Relay App posts/comments, reconfigured app settings cleaned up dead code, reorganized code.

Thanks for using **Relay App** — publish faster, safer, and without shared accounts!
