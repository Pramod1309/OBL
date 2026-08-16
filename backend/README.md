# One Bag Learning Enquiry Backend

This is a tiny local backend for the contact form. It uses Python's built-in HTTP server and SQLite, so it does not need npm packages.

Run it locally:

```powershell
python backend/server.py
```

Then open the frontend from `http://localhost:8000/`. The contact form will post to:

```text
http://localhost:5000/api/enquiries
```

GitHub Pages cannot run this backend. For live form database storage, deploy this backend to a server or backend host and set the form's `data-endpoint` in `contact.html` to the hosted API URL.
