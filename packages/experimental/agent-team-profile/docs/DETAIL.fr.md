![Une conversation intitulée « Ajouter une limitation de débit », son bouton d’équipe d’agents et le panneau affichant deux membres et deux tâches partagées](preview.svg)

Demandez à l’agent avec lequel vous discutez, le responsable, de répartir le travail. Il crée des coéquipiers nommés, inscrit le travail sur un tableau de tâches partagé, attend leurs résultats et vous les présente.

## Utilisation

- Formulez votre demande simplement, par exemple : « Utilise les équipes d’agents pour répartir cette tâche entre deux coéquipiers, attends qu’ils terminent et résume les résultats. »
- Cliquez sur **Équipe d'agents**, à côté du titre de la conversation, pour voir les **Membres** et les **Tâches partagées**. Chaque tâche affiche son état, son **Propriétaire**, ses périmètres d’écriture (**Écrire des étendues**) et les tâches dont elle dépend sous **Bloqué par**.
- Cliquez sur un coéquipier pour ouvrir sa conversation et lui parler directement.
- Le panneau est en lecture seule. Pour modifier les tâches ou les coéquipiers, adressez-vous au responsable.

## À savoir

- Chaque coéquipier est un agent distinct qui envoie ses propres requêtes au modèle. Une équipe consomme donc plus de tokens qu’un seul agent.
- Les coéquipiers partagent les mêmes fichiers. Le chevauchement des périmètres d’écriture (**Écrire des étendues**) affiche seulement un avertissement ; rien n’empêche deux coéquipiers de modifier le même fichier.
- Une équipe peut créer jusqu’à 8 coéquipiers au total, y compris ceux dont le démarrage a échoué, et conserver jusqu’à 256 tâches. Supprimer une tâche libère une place.
- Lorsque le plugin est activé, les outils habituels de sous-agents sont désactivés et les agents délèguent le travail par l’intermédiaire de l’équipe. Les workflows peuvent toujours lancer des agents à exécution unique. Désactiver le plugin rétablit les outils de sous-agents.
- Si vous activez le plugin alors qu’une conversation est ouverte, rechargez la page pour afficher le panneau.
