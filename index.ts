import express from "express";
import { ObjectId } from "mongodb";
import URLController from "./controllers/urls.ts";
import type { Url } from "./models/urls.ts";

const app = express();
const port = 3000;

const urlController = new URLController();


// Get one url by id
app.get("/url/:id", (req, res) => {
  const { id } = req.params;
  const urlId = new ObjectId(id);
  urlController.getUrlById(urlId)
    .then((urlDoc) => {
      if (urlDoc) {
        res.status(200).json(urlDoc);
      } else {
        res.status(404).json({ message: "Url not found" });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    });
});


// Get all urls
app.get("/urls", async (req, res) => {
  const urlDocs = await urlController.getUrls();
  const urls: Url[] = urlDocs.map(doc => ({
    _id: doc._id,
    from: doc.from,
    to: doc.to,
    clicks: doc.clicks
  }));
  res.json(urls);
});


// Update a url
app.post("/url", express.json(), async (req, res) => {
  const { from, to, description } = req.body;
  const urlDoc = await urlController.addUrls({
    from,
    to,
    description,
  });
  res.status(201).json(urlDoc);
});


// Delete a url
app.delete("/url/:id", async (req, res) => {
  const { id } = req.params;
  const urlId = new ObjectId(id);
  const urlDoc = await urlController.deleteUrl(urlId);
  if (urlDoc) {
    res.status(200).json({ message: "Url deleted successfully" });
  } else {
    res.status(404).json({ message: "Url not found" });
  }
});


app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
