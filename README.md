# Électricité au gymnase

Cours d'électricité interactif pour le gymnase (secondaire II), en français, en quatre chapitres :

| Chapitre | Contenu | Animations |
|---|---|---|
| [1. Électrostatique](cours-electricite/1-electrostatique.html) | charge, électrisation, loi de Coulomb, champ électrique, tension, condensateur | influence, Coulomb, lignes de champ, canon à électrons |
| [2. Électrodynamique](cours-electricite/2-electrodynamique.html) | courant, tension, loi d'Ohm, résistivité, puissance et énergie, sécurité | électrons dans un fil, caractéristique U-I, compteur électrique |
| [3. Lois des circuits](cours-electricite/3-lois-des-circuits.html) | schémas, Kirchhoff, série, parallèle, mixte, générateur réel | guirlande, simulateur de circuit, batterie et démarreur |
| [4. Production en Suisse](cours-electricite/4-production-suisse.html) | mix 2025, induction, alternateur, hydraulique, nucléaire, solaire, réseau, transport | aimant et bobine, alternateur, centrale hydraulique, journée sur le réseau, très haute tension |

Chaque chapitre contient des schémas SVG, des exemples pratiques, des exercices avec solutions détaillées et un résumé.

## Fiche d'exercices (Word)

[`cours-electricite/fiche-exercices-electricite.docx`](cours-electricite/fiche-exercices-electricite.docx) accompagne le cours : pour chaque chapitre, des questions théoriques avec lignes de réponse et des exercices progressifs (niveaux 1 à 3), dont deux sur schéma. Le corrigé détaillé commence à la page 13, dans une section séparée qu'on peut retirer avant de distribuer. Mise en page pour la photocopie : noir et blanc, Arial 12, interligne 1,5, format A4.

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

# Rayonnement du corps noir

[`cours-corps-noir/index.html`](cours-corps-noir/index.html) : cours interactif sur le rayonnement thermique (secondaire II), en une seule page autonome (HTML, CSS et JavaScript dans le même fichier, sans dépendance).

| Section | Contenu | Simulation |
|---|---|---|
| 1. Tout ce qui est chaud brille | rayonnement thermique, observations | |
| 2. Le corps noir | définition, cavité de Kirchhoff, émissivité | le four à trou (photons, absorption, émission) |
| 3. Le spectre de Planck | loi de Planck, lecture de la courbe | spectromètre : température, exemples, comparaison, échelle log, couleur perçue |
| 4. La loi de Wien | λmax·T = b, échelle de Pouillet, point de Draper | devine la température d'une étoile |
| 5. La loi de Stefan-Boltzmann | M = σT⁴, puissance du Soleil | chauffe la barre (équilibre radiatif, T⁴, fusion) |
| 6. La température des planètes | équilibre radiatif, albédo, effet de serre à une couche | Mercure, Vénus, Terre, Mars, Jupiter |
| 7. La catastrophe ultraviolette | Rayleigh-Jeans, quanta E = hf, fond cosmologique | Planck contre la physique classique ; le distributeur de quanta |
| 8. Exercices | 10 exercices (niveaux 1 à 3) avec solutions | |
| 9. L'essentiel | résumé et formulaire | |

Les couleurs des corps noirs sont calculées à partir de la loi de Planck et des fonctions colorimétriques CIE 1931 (ajustement analytique de Wyman, Sloan et Shirley), puis converties en sRGB.
