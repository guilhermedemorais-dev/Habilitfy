# Local Environment

## Padrao de ambiente local
- Ambiente isolado por projeto.
- Dependencias reproduziveis.
- Configuracao documentada.

## Regras para .env / .env.example
- `.env.example` documenta variaveis esperadas.
- `.env` real nunca deve ser commitado.

## Variaveis de ambiente
- Pode: configuracoes nao sensiveis e apontadores.
- Nao pode: segredos e chaves reais.

## Convencao de nomes
- Prefixo por dominio (ex.: APP_, DB_, API_).
- Letras maiusculas e underscore.

## Setup local (agnostico)
- Passos claros e repetiveis.
- Sem dependencia de OS especifico.

## Relacao com runtime
- Runtime de bots deve respeitar variaveis padrao e `.env.example` quando aplicavel.
