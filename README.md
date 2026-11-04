# Cours de physique interactifs pour le gymnase

Deux cours interactifs en français pour le secondaire II, qui partagent la même mise en page (cahier de labo, thèmes clair et sombre) :

- [Électricité au gymnase](#électricité-au-gymnase) : `cours-electricite/`
- [Dynamique au gymnase](#dynamique-au-gymnase) : `cours-dynamique/`

Aucune installation ni serveur n'est nécessaire : ouvrir le fichier `index.html` du cours dans un navigateur. Tout est en HTML, CSS et JavaScript sans dépendance. Les polices viennent de Google Fonts ; hors ligne, le navigateur utilise des polices de remplacement.

---

## Dynamique au gymnase

Cours de mécanique (lois de Newton) sur une seule page : `cours-dynamique/index.html`.

| Chapitre | Contenu | Simulation |
|---|---|---|
| 1. Les forces | force, vecteur, forces usuelles, masse et poids, résultante, loi de Hooke, diagramme des forces | somme de forces (flèches à tirer), banc d'essai des ressorts |
| 2. Inertie | première loi, référentiel d'inertie, équilibre en composantes | pierre de curling sur différentes surfaces |
| 3. ΣF = m·a | deuxième loi, méthode en cinq étapes, lien avec le MRUA | chariot sur rail avec courbes v(t) |
| 4. Action–réaction | troisième loi, piège du livre sur la table, paradoxe de l'âne | deux patineurs qui se repoussent |
| 5. Frottement et plan incliné | frottement statique et cinétique, décomposition du poids, angle limite, pentes en % | plan incliné réglable |
| 6. Poids apparent et systèmes liés | balance dans l'ascenseur, apesanteur, cordes et poulies | ascenseur, bloc sur table et machine d'Atwood |
| 7. Mouvement circulaire | accélération et force centripètes, vitesse maximale en virage, satellites | voiture dans un virage (sortie de route comprise) |

Chaque chapitre contient des exemples pratiques (souvent suisses : Stoosbahn, InterCity, curling), des exercices auto-corrigés (27 au total, tolérance de 2 %, indices sur les erreurs d'unités) avec solution détaillée, et un résumé. Suivent un formulaire et une **évaluation finale** de 16 questions (26 points) notée sur 6 selon le barème suisse ; la série A est fixe, « Nouvelle série » tire d'autres valeurs.

### Retranscription Word

[`cours-dynamique/cours-dynamique.docx`](cours-dynamique/cours-dynamique.docx) reprend tout le cours (A4, 43 pages) : théorie, exemples, captures des simulations avec leurs questions « À essayer », exercices avec lignes de réponse, formulaire, évaluation finale (série A) avec table de conversion points → note. Le corrigé des exercices et de l'évaluation est dans une section séparée à la fin.

Le document est généré à partir de la page elle-même, ce qui garantit que les deux versions disent la même chose :

```
node cours-dynamique/outils/extract.js /tmp/dynamique-src
node cours-dynamique/outils/build-docx.js /tmp/dynamique-src
```

(Playwright et le paquet npm `docx` sont nécessaires.)

### Structure

```
cours-dynamique/
  index.html                  le cours complet
  cours-dynamique.docx        retranscription Word
  assets/
    dynamique.css             styles (code couleur des vecteurs, thèmes clair et sombre)
    moteur.js                 canvas, dessin des vecteurs, correction des exercices
    simulations.js            les neuf simulations
    evaluation.js             évaluation finale et note sur 6
  outils/
    extract.js, build-docx.js génération du fichier Word
```

---

## Électricité au gymnase

Cours d'électricité en quatre chapitres :

| Chapitre | Contenu | Animations |
|---|---|---|
| [1. Électrostatique](cours-electricite/1-electrostatique.html) | charge, électrisation, loi de Coulomb, champ électrique, tension, condensateur | influence, Coulomb, lignes de champ, canon à électrons |
| [2. Électrodynamique](cours-electricite/2-electrodynamique.html) | courant, tension, loi d'Ohm, résistivité, puissance et énergie, sécurité | électrons dans un fil, caractéristique U-I, compteur électrique |
| [3. Lois des circuits](cours-electricite/3-lois-des-circuits.html) | schémas, Kirchhoff, série, parallèle, mixte, générateur réel | guirlande, simulateur de circuit, batterie et démarreur |
| [4. Production en Suisse](cours-electricite/4-production-suisse.html) | mix 2025, induction, alternateur, hydraulique, nucléaire, solaire, réseau, transport | aimant et bobine, alternateur, centrale hydraulique, journée sur le réseau, très haute tension |

Chaque chapitre contient des schémas SVG, des exemples pratiques, des exercices avec solutions détaillées et un résumé.

### Fiche d'exercices (Word)

[`cours-electricite/fiche-exercices-electricite.docx`](cours-electricite/fiche-exercices-electricite.docx) accompagne le cours : pour chaque chapitre, des questions théoriques avec lignes de réponse et des exercices progressifs (niveaux 1 à 3), dont deux sur schéma. Le corrigé détaillé commence à la page 13, dans une section séparée qu'on peut retirer avant de distribuer. Mise en page pour la photocopie : noir et blanc, Arial 12, interligne 1,5, format A4.

### Structure

```
cours-electricite/
  index.html                  sommaire, mode d'emploi, aide-mémoire
  1-electrostatique.html
  2-electrodynamique.html
  3-lois-des-circuits.html
  4-production-suisse.html
  assets/
    cours.css                 styles communs (thèmes clair et sombre)
    cours.js                  moteur d'animation, formatage, sommaire
    ch1.js … ch4.js           animations de chaque chapitre
```

Les chiffres suisses (production 2025, centrales, lois) proviennent de l'OFEN, de Swissolar et des exploitants ; ils sont arrondis et datent de l'automne 2026.
