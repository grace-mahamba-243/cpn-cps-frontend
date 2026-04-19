import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Alerte from '../../../composants/interface/Alerte'
import AvatarInitiales from '../../../composants/interface/AvatarInitiales'
import { CATALOGUE_PERMISSIONS } from '../controle-acces'
import serviceUtilisateurs from '../../../services/api/serviceUtilisateurs'

const LIBELLE_NON_RENSEIGNE = 'Non renseigné'

function extraireInitiales(nomAffichage = '') {
  return nomAffichage
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((fragment) => fragment[0]?.toUpperCase() ?? '')
    .join('')
}

function formaterSexe(sexe) {
  if (sexe === 'F') {
    return 'Féminin'
  }

  if (sexe === 'M') {
    return 'Masculin'
  }

  return LIBELLE_NON_RENSEIGNE
}

function formaterDateLongue(date) {
  if (!date) {
    return LIBELLE_NON_RENSEIGNE
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function formaterDateHeure(date) {
  if (!date) {
    return 'Aucune connexion enregistrée'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function determinerVariantAvatar(roleCode) {
  if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN') {
    return 'primaire'
  }

  if (roleCode === 'MEDECIN' || roleCode === 'SAGE_FEMME') {
    return 'tertiaire'
  }

  if (roleCode === 'INFIRMIERE') {
    return 'secondaire'
  }

  return 'neutre'
}

// Ce composant affiche la fiche detaillee d un utilisateur avec ses informations,
// ses permissions effectives et un resume d activite accessible depuis la liste admin.
function PageDetailUtilisateur() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [etat, setEtat] = useState({
    estChargement: true,
    erreur: '',
    source: 'api',
    utilisateur: null,
  })
  const [retourAction, setRetourAction] = useState({ type: '', titre: '', message: '' })
  const [actionEnCours, setActionEnCours] = useState('')

  useEffect(() => {
    let estActif = true

    const chargerUtilisateur = async () => {
      try {
        const resultat = await serviceUtilisateurs.recupererUtilisateur(userId)

        if (!estActif) {
          return
        }

        setEtat({
          estChargement: false,
          erreur: '',
          source: resultat.source,
          utilisateur: resultat.utilisateur,
        })
      } catch (exception) {
        if (!estActif) {
          return
        }

        setEtat({
          estChargement: false,
          erreur: exception.message,
          source: 'api',
          utilisateur: null,
        })
      }
    }

    void chargerUtilisateur()

    return () => {
      estActif = false
    }
  }, [userId])

  const permissionsAffichees = useMemo(() => {
    if (!etat.utilisateur) {
      return []
    }

    return CATALOGUE_PERMISSIONS.map((permission) => ({
      ...permission,
      estAutorisee: etat.utilisateur.permissions.includes(permission.code),
    }))
  }, [etat.utilisateur])

  const activitesRecentes = useMemo(() => {
    if (!etat.utilisateur) {
      return []
    }

    return [
      {
        accent: 'primaire',
        moment: etat.utilisateur.dernierAccesAt ? 'Dernière connexion' : 'Journal vide',
        texte: formaterDateHeure(etat.utilisateur.dernierAccesAt),
      },
      {
        accent: etat.utilisateur.actif ? 'primaire' : 'erreur',
        moment: 'Statut du compte',
        texte: etat.utilisateur.actif ? 'Compte actif et autorisé à se connecter.' : 'Compte actuellement inactif.',
      },
      {
        accent: 'secondaire',
        moment: 'Rôle opérationnel',
        texte: `${etat.utilisateur.role} affecté à ${etat.utilisateur.unite || LIBELLE_NON_RENSEIGNE}.`,
      },
    ]
  }, [etat.utilisateur])

  const basculerStatutCompte = async () => {
    if (!etat.utilisateur) {
      return
    }

    const prochainStatut = !etat.utilisateur.actif
    const confirmation = window.confirm(
      prochainStatut
        ? `Voulez-vous vraiment activer le compte de ${etat.utilisateur.nomAffichage} ?`
        : `Voulez-vous vraiment désactiver le compte de ${etat.utilisateur.nomAffichage} ?`,
    )

    if (!confirmation) {
      return
    }

    setActionEnCours('statut')
    setRetourAction({ type: '', titre: '', message: '' })

    try {
      const utilisateurMisAJour = await serviceUtilisateurs.modifierUtilisateur(etat.utilisateur.id, {
        actif: prochainStatut,
      })

      setEtat((etatCourant) => ({
        ...etatCourant,
        utilisateur: {
          ...etatCourant.utilisateur,
          ...utilisateurMisAJour,
          actif: utilisateurMisAJour.actif,
        },
      }))
      setRetourAction({
        type: 'succes',
        titre: 'Statut mis à jour',
        message: prochainStatut
          ? `Le compte de ${etat.utilisateur.nomAffichage} a été activé.`
          : `Le compte de ${etat.utilisateur.nomAffichage} a été désactivé.`,
      })
    } catch (exception) {
      setRetourAction({
        type: 'erreur',
        titre: 'Action impossible',
        message: exception.message,
      })
    } finally {
      setActionEnCours('')
    }
  }

  const supprimerCompte = async () => {
    if (!etat.utilisateur) {
      return
    }

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer l'utilisateur ${etat.utilisateur.nomAffichage} ? Cette action est irréversible.`,
    )

    if (!confirmation) {
      return
    }

    setActionEnCours('suppression')
    setRetourAction({ type: '', titre: '', message: '' })

    try {
      await serviceUtilisateurs.supprimerUtilisateur(etat.utilisateur.id)
      navigate('/admin/utilisateurs', {
        replace: true,
        state: {
          messageSucces: `L'utilisateur ${etat.utilisateur.nomAffichage} a été supprimé avec succès.`,
        },
      })
    } catch (exception) {
      setRetourAction({
        type: 'erreur',
        titre: 'Suppression impossible',
        message: exception.message,
      })
      setActionEnCours('')
    }
  }

  if (etat.estChargement) {
    return (
      <div className="page-detail-utilisateur">
        <section className="detail-utilisateur__etat">
          <span className="material-symbols-outlined">hourglass_top</span>
          <p>Chargement de la fiche utilisateur...</p>
        </section>
      </div>
    )
  }

  if (etat.erreur || !etat.utilisateur) {
    return (
      <div className="page-detail-utilisateur">
        <Alerte type="erreur" titre="Fiche indisponible">
          {etat.erreur || 'La fiche demandée est introuvable.'}
        </Alerte>

        <div className="detail-utilisateur__actions-bas">
          <button type="button" className="detail-utilisateur__action-secondaire" onClick={() => navigate('/admin/utilisateurs')}>
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  const utilisateur = etat.utilisateur

  return (
    <div className="page-detail-utilisateur">
      {location.state?.messageSucces ? (
        <Alerte type="succes" titre="Modification enregistrée">
          {location.state.messageSucces}
        </Alerte>
      ) : null}

      {retourAction.message ? (
        <Alerte type={retourAction.type} titre={retourAction.titre}>
          {retourAction.message}
        </Alerte>
      ) : null}

      {etat.source === 'local' ? (
        <Alerte type="avertissement" titre="Mode de secours local">
          Le backend utilisateur est indisponible. La fiche affichée provient du stockage local du frontend.
        </Alerte>
      ) : null}

      <section className="detail-utilisateur__hero">
        <div className="detail-utilisateur__hero-identite">
          <div className="detail-utilisateur__avatar-wrap">
            <AvatarInitiales
              initiales={extraireInitiales(utilisateur.nomAffichage)}
              taille="grand"
              variant={determinerVariantAvatar(utilisateur.roleCode)}
            />
            <span
              className={
                utilisateur.actif
                  ? 'detail-utilisateur__statut-hero detail-utilisateur__statut-hero--actif'
                  : 'detail-utilisateur__statut-hero detail-utilisateur__statut-hero--inactif'
              }
            >
              {utilisateur.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>

          <div className="detail-utilisateur__hero-texte">
            <h2>{utilisateur.nomAffichage}</h2>
            <p>
              <span className="material-symbols-outlined">badge</span>
              {utilisateur.role}
            </p>
          </div>
        </div>

        <div className="detail-utilisateur__hero-actions">
          <button type="button" className="detail-utilisateur__action-secondaire" onClick={() => navigate('/admin/utilisateurs')}>
            Retour
          </button>
          <button
            type="button"
            className="detail-utilisateur__action-primaire"
            onClick={() => navigate(`/admin/utilisateurs/${utilisateur.id}/modifier`)}
          >
            <span className="material-symbols-outlined">edit</span>
            Modifier le profil
          </button>
          <button
            type="button"
            className={
              utilisateur.actif
                ? 'detail-utilisateur__action-tonale detail-utilisateur__action-tonale--danger'
                : 'detail-utilisateur__action-tonale detail-utilisateur__action-tonale--confirmation'
            }
            onClick={() => {
              void basculerStatutCompte()
            }}
            disabled={actionEnCours === 'statut'}
          >
            <span className="material-symbols-outlined">{utilisateur.actif ? 'person_off' : 'person_check'}</span>
            {actionEnCours === 'statut' ? 'Traitement...' : utilisateur.actif ? 'Désactiver' : 'Activer'}
          </button>
          <button
            type="button"
            className="detail-utilisateur__action-tonale detail-utilisateur__action-tonale--danger"
            onClick={() => {
              void supprimerCompte()
            }}
            disabled={actionEnCours === 'suppression'}
          >
            <span className="material-symbols-outlined">delete</span>
            {actionEnCours === 'suppression' ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </section>

      <div className="detail-utilisateur__grille">
        <div className="detail-utilisateur__colonne-principale">
          <section className="detail-utilisateur__carte">
            <div className="detail-utilisateur__carte-entete">
              <div className="detail-utilisateur__icone-bloc detail-utilisateur__icone-bloc--primaire">
                <span className="material-symbols-outlined">contact_page</span>
              </div>
              <h3>Données Personnelles</h3>
            </div>

            <div className="detail-utilisateur__donnees">
              <div>
                <p>Numéro de téléphone</p>
                <strong>{utilisateur.telephone || LIBELLE_NON_RENSEIGNE}</strong>
              </div>
              <div>
                <p>Adresse email</p>
                <strong>{utilisateur.email || LIBELLE_NON_RENSEIGNE}</strong>
              </div>
              <div>
                <p>Sexe</p>
                <strong>{formaterSexe(utilisateur.sexe)}</strong>
              </div>
              <div>
                <p>Date de naissance</p>
                <strong>{formaterDateLongue(utilisateur.dateNaissance)}</strong>
              </div>
              <div>
                <p>Service / unité</p>
                <strong>{utilisateur.unite || LIBELLE_NON_RENSEIGNE}</strong>
              </div>
              <div>
                <p>Identifiant</p>
                <strong>{utilisateur.identifiant}</strong>
              </div>
              <div className="detail-utilisateur__donnee-large">
                <p>Adresse résidentielle</p>
                <strong>{utilisateur.adresse || LIBELLE_NON_RENSEIGNE}</strong>
              </div>
            </div>
          </section>

        </div>

        <aside className="detail-utilisateur__colonne-secondaire">
          <section className="detail-utilisateur__carte detail-utilisateur__carte--tonal">
            <h3>Activités Récentes</h3>

            <div className="detail-utilisateur__timeline">
              {activitesRecentes.map((activite) => (
                <div key={`${activite.moment}-${activite.texte}`} className="detail-utilisateur__timeline-item">
                  <span
                    className={
                      activite.accent === 'erreur'
                        ? 'detail-utilisateur__timeline-point detail-utilisateur__timeline-point--erreur'
                        : 'detail-utilisateur__timeline-point'
                    }
                  />
                  <div>
                    <p>{activite.moment}</p>
                    <strong>{activite.texte}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default PageDetailUtilisateur