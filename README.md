# Électricité au gymnase

Cours d'électricité interactif pour le gymnase (secondaire II), en français, en quatre chapitres :

| Chapitre | Contenu | Animations |
|---|---|---|
| [1. Électrostatique](cours-electricite/1-electrostatique.html) | charge, électrisation, loi de Coulomb, champ électrique, tension, condensateur | influence, Coulomb, lignes de champ, canon à électrons |
| [2. Électrodynamique](cours-electricite/2-electrodynamique.html) | courant, tension, loi d'Ohm, résistivité, puissance et énergie, sécurité | électrons dans un fil, caractéristique U-I, compteur électrique |
| [3. Lois des circuits](cours-electricite/3-lois-des-circuits.html) | schémas, Kirchhoff, série, parallèle, mixte, générateur réel | guirlande, simulateur de circuit, batterie et démarreur |
| [4. Production en Suisse](cours-electricite/4-production-suisse.html) | mix 2025, induction, alternateur, hydraulique, nucléaire, solaire, réseau, transport | aimant et bobine, alternateur, centrale hydraulique, journée sur le réseau, très haute tension |

Chaque chapitre contient des schémas SVG, des exemples pratiques, des exercices avec solutions détaillées et un résumé.

## Utilisation

Ouvrir `cours-electricite/index.html` dans un navigateur. Aucune installation ni serveur n'est nécessaire : tout est en HTML, CSS et JavaScript sans dépendance. Les polices viennent de Google Fonts ; hors ligne, le navigateur utilise des polices de remplacement.

## Structure

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
