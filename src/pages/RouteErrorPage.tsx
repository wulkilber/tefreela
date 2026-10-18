import PublicHeader from "../components/PublicHeader"
import { Button, ButtonLink, Heading } from "../components/ui"
export default function RouteErrorPage({
  notFound = false,
}: {
  notFound?: boolean
}) {
  return (
    <div className="page-bg">
      <PublicHeader />
      <main className="container service-page route-error-content">
        <span className="route-error-mark">{notFound ? "404 · UM NOVO CAMINHO" : "VAMOS TENTAR DE NOVO"}</span>
        <Heading as="h1">
          {notFound
            ? "Página não encontrada"
            : "Não foi possível abrir esta página"}
        </Heading>
        <p>
          {notFound
            ? "Confira o endereço ou volte para o início."
            : "Tente carregar novamente. Se o problema continuar, fale com o responsável pelo projeto."}
        </p>
        <div className="action-row">
          {!notFound && (
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          )}
          <ButtonLink to="/" variant="secondary">
            Voltar para o início
          </ButtonLink>
        </div>
      </main>
    </div>
  )
}
