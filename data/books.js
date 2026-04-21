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
        title: "La Taverne du Vieux Sage",
        description: "Le crépitement du feu et les murmures des voyageurs vous accueillent dans la chaleur de l'auberge.",
        ambiance: "tavern",
        color: "#7A3010"
      },
      {
        id: 2,
        chapter: "Chapitre I",
        title: "La Forêt Ancienne",
        description: "Les arbres millénaires chuchotent leurs secrets dans le vent. Des chants d'oiseaux vous guident.",
        ambiance: "forest",
        color: "#1A4A2A"
      },
      {
        id: 3,
        chapter: "Chapitre II",
        title: "La Pluie de l'Oubli",
        description: "Des gouttes froides s'écrasent sur les pavés de la cité endormie. La nuit est longue.",
        ambiance: "rain",
        color: "#1A3A4E"
      },
      {
        id: 4,
        chapter: "Chapitre III",
        title: "Les Profondeurs",
        description: "Un silence minéral, ponctué de gouttes lointaines. Les parois de pierre gardent leurs secrets.",
        ambiance: "cave",
        color: "#1E0F30"
      },
      {
        id: 5,
        chapter: "Chapitre IV",
        title: "L'Horizon Infini",
        description: "Les vagues scandent leur rythme éternel contre la falaise. Le sel mord l'air.",
        ambiance: "ocean",
        color: "#082E43"
      },
      {
        id: 6,
        chapter: "Chapitre V",
        title: "La Grande Tempête",
        description: "Le ciel se déchire. La fureur des éléments s'abat sur le monde sans pitié.",
        ambiance: "storm",
        color: "#0D1420"
      },
      {
        id: 7,
        chapter: "Chapitre VI",
        title: "La Bibliothèque Secrète",
        description: "Un mystère ancien flotte entre les rayonnages poussiéreux. Quelque chose vous observe.",
        ambiance: "mystery",
        color: "#0D0820"
      },
      {
        id: 8,
        chapter: "Épilogue",
        title: "L'Aurore Nouvelle",
        description: "Le chant des oiseaux annonce une ère nouvelle. La lumière revient, douce et certaine.",
        ambiance: "forest",
        color: "#1A4A2A"
      }
    ]
  }
};
