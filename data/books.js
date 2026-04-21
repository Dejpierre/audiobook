/**
 * Configuration des livres.
 * Pour ajouter un livre : copier le bloc et incrémenter la clé (2, 3...).
 * Chaque page a :
 *   id         – numéro de page (1-based)
 *   chapter    – label du chapitre affiché en petit
 *   title      – titre de l'atmosphère
 *   description – courte phrase d'ambiance
 *   ambiance   – clé du moteur audio : fire | tavern | forest | rain | storm | ocean | cave | mystery
 *   color      – teinte de fond (hex)
 *   endTrigger – mots de la dernière phrase : détectés à voix haute → passe à la page suivante
 *   keywords   – fallback si pas d'endTrigger : scoring global pour sauter à une page
 */
const BOOKS = {
  1: {
    id: 1,
    title: "Les Chroniques de l'Aube",
    author: "Votre Nom",
    pages: [
      {
        id: 1,
        chapter: "Prologue",
        title: "La Petite Maison du Lac",
        description: "Tout au bord du lac, cachée entre les grands arbres, une petite maison de bois attend la nuit.",
        ambiance: "forest",
        color: "#1A4A2A",
        audioSrc: "audio/lac.mp3",
        endTrigger: ["magie", "commençait"]
      },
      {
        id: 2,
        chapter: "Chapitre I",
        title: "La Loutre et sa Lanterne",
        description: "Dans la petite maison vivait une loutre douce et discrète, gardienne d'un travail secret.",
        ambiance: "ocean",
        color: "#082E43",
        audioSrc: "audio/lac-page-2.mp3",
        endTrigger: ["connaissait", "particulier", "loutre"]
      },
      {
        id: 3,
        chapter: "Chapitre II",
        title: "La Pluie de l'Oubli",
        description: "Des gouttes froides s'écrasent sur les pavés de la cité endormie. La nuit est longue.",
        ambiance: "rain",
        color: "#1A3A4E",
        keywords: ["pluie", "gouttes", "pavés", "ruisseau", "averse", "humide", "flaque", "nuages", "imperméable", "bruine", "crachin", "ruisselle"]
      },
      {
        id: 4,
        chapter: "Chapitre III",
        title: "Les Profondeurs",
        description: "Un silence minéral, ponctué de gouttes lointaines. Les parois de pierre gardent leurs secrets.",
        ambiance: "cave",
        color: "#1E0F30",
        keywords: ["grotte", "caverne", "pierre", "souterrain", "tunnel", "obscurité", "stalactite", "roche", "gouffre", "galerie", "suinte", "profondeur"]
      },
      {
        id: 5,
        chapter: "Chapitre IV",
        title: "L'Horizon Infini",
        description: "Les vagues scandent leur rythme éternel contre la falaise. Le sel mord l'air.",
        ambiance: "ocean",
        color: "#082E43",
        keywords: ["mer", "vagues", "océan", "falaise", "sel", "horizon", "bateau", "côte", "écume", "marins", "mouettes", "ressac"]
      },
      {
        id: 6,
        chapter: "Chapitre V",
        title: "La Grande Tempête",
        description: "Le ciel se déchire. La fureur des éléments s'abat sur le monde sans pitié.",
        ambiance: "storm",
        color: "#0D1420",
        keywords: ["tempête", "tonnerre", "éclair", "orage", "foudre", "rafale", "ouragan", "gronde", "tremble", "fureur", "éléments", "déchire"]
      },
      {
        id: 7,
        chapter: "Chapitre VI",
        title: "La Bibliothèque Secrète",
        description: "Un mystère ancien flotte entre les rayonnages poussiéreux. Quelque chose vous observe.",
        ambiance: "mystery",
        color: "#0D0820",
        keywords: ["mystère", "bibliothèque", "secret", "livre", "poussière", "ombre", "regard", "silhouette", "antique", "parchemin", "chuchotement", "énigme"]
      },
      {
        id: 8,
        chapter: "Épilogue",
        title: "L'Aurore Nouvelle",
        description: "Le chant des oiseaux annonce une ère nouvelle. La lumière revient, douce et certaine.",
        ambiance: "forest",
        color: "#1A4A2A",
        keywords: ["aurore", "aube", "lumière", "matin", "soleil", "espoir", "renouveau", "printemps", "oiseaux", "chant", "horizon", "naissance"]
      }
    ]
  }
};
