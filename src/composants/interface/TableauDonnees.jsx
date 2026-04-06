function TableauDonnees({ colonnes, lignes }) {
  return (
    <table className="tableau-donnees">
      <thead>
        <tr>
          {colonnes.map((colonne) => (
            <th
              key={colonne.key}
              className={colonne.align === 'droite' ? 'tableau-donnees__cellule--droite' : ''}
            >
              {colonne.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {lignes.map((ligne, index) => (
          <tr key={ligne.id ?? index}>
            {colonnes.map((colonne) => (
              <td
                key={colonne.key}
                className={colonne.align === 'droite' ? 'tableau-donnees__cellule--droite' : ''}
              >
                {colonne.render ? colonne.render(ligne) : ligne[colonne.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TableauDonnees