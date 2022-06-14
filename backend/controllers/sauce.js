const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauce = (req, res, next) => {
  // Vérifier si c'est bien le propriétaire de la sauce
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId === req.auth.userId) {
        const sauceObject = req.file ?
          {
            ...JSON.parse(req.body.thing),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
          } : { ...req.body };
        Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(
            () => {
              res.status(201).json({
                message: 'Sauce updated successfully!'
              });
            }
          ).catch(
            (error) => {
              res.status(400).json({
                error: error
              });
            }
          );
      }
    })
    .catch(error => res.status(500).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  // Vérifier si c'est bien le propriétaire de la sauce
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId === req.auth.userId) {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
            .catch(error => res.status(400).json({ error }));
        });
      }
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};


exports.likeSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (req.body.like === 1) {
        if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId)) {
          Sauce.updateOne({ _id: req.params.id },
            {
              $inc: { likes: 1 },
              $push: { usersLiked: req.body.userId }
            })
            .then((sauce) => res.status(200).json({ message: 'Sauce likée !' }))
            .catch((error) => res.status(400).json({ error }))
        }
      } else if (req.body.like === -1) {
        if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId)) {
          Sauce.updateOne({ _id: req.params.id },
            {
              $inc: { dislikes: 1 },
              $push: { usersDisliked: req.body.userId }
            })
            .then((sauce) => res.status(200).json({ message: 'Sauce dislikée !' }))
            .catch((error) => res.status(400).json({ error }))
        }
      } else {
        if (sauce.usersLiked.includes(req.body.userId)) {
          Sauce.updateOne({ _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId }
            })
            .then((sauce) => res.status(200).json({ message: 'Like supprimé' }))
            .catch((error) => res.status(400).json({ error }))
        } else if (sauce.usersDisliked.includes(req.body.userId)) {
          Sauce.updateOne({ _id: req.params.id },
            {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId }
            })
            .then((sauce) => res.status(200).json({ message: 'Dislike supprimé' }))
            .catch((error) => res.status(400).json({ error }))
        }
      }
    })
    .catch((error) => res.status(400).json({ error }))
};