/* ==========================================================================
   RÉGLAGES DU SITE — le seul fichier à modifier pour changer un comportement.
   Tout le reste (textes, photos) se modifie directement dans les pages .html.
   ========================================================================== */
window.SITE_CONFIG = {

  /* Adresse définitive du site, sans barre oblique finale.
     Sert aux liens de partage. À corriger le jour où le nom de domaine change.
     ⚠ La même adresse est écrite dans `_source/contenu/global/identite.json`,
     d'où sont tirés les liens canoniques et le plan du site. Changer les deux. */
  siteUrl: 'https://hnatalis.github.io/eva-antoine-osteopathe',

  /* ---- Formulaire de contact -------------------------------------------
     Le site est hébergé sur GitHub Pages : des fichiers, et rien d'autre.
     Aucun serveur ne peut donc recevoir le formulaire, il faut un service.

     'formsubmit' : aucun compte à créer. Coller ci-dessous l'adresse
                    https://formsubmit.co/ajax/VOTRE-JETON
                    Le jeton s'obtient une fois pour toutes : voir GUIDE.md,
                    « Activer le formulaire de contact ».
     'formspree'  : variante avec compte (formspree.io), gratuite jusqu'à
                    50 messages par mois. Coller l'adresse du formulaire.
     'aucun'      : l'envoi est désactivé ; le formulaire affiche d'emblée le
                    téléphone et l'e-mail. C'est aussi ce qui se passe tout
                    seul si `endpoint` est vide, pour qu'un réglage oublié ne
                    fasse jamais disparaître un message dans le vide.         */
  form: {
    mode: 'formsubmit',
    endpoint: ''          // ex. 'https://formsubmit.co/ajax/a1b2c3d4e5f6…'
  },

  /* ---- Statistiques de visite ------------------------------------------
     Chargées UNIQUEMENT si le visiteur a cliqué « Accepter » dans la bannière.
     Aucune requête n'est envoyée tant que `provider` vaut 'none'.

     Pour les activer, choisir UNE ligne et remplacer 'none' :
       provider:'plausible', domain:'eva-antoine-osteopathe.fr'
       provider:'umami',     id:'<identifiant du site>', src:'<url du script>'
       provider:'ga4',       id:'G-XXXXXXXXXX'
       provider:'cloudflare',id:'<token>'                                     */
  analytics: {
    provider: 'none',
    domain: '',
    id: '',
    src: ''
  }
};
