<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest
  
robo-bb
=========================
* Este projeto contém rotas para captura das tranferências constitucionais do banco do brasil de acordo com cada município.

 Lista de funcionalidades:

 * @Route("api/demonstrativoArrecadacao/:cidade/:estado?dataInicial=00/00/0000&dataFinal=00/00/0000")     -> Retorna lista de tranferências (GET);

 ## 🛠️ Construído com
* [NestJS](https://nestjs.com/) - Framework 
* [TypeScript](https://www.typescriptlang.org/) - Linguagem
* [VsCode](https://code.visualstudio.com/) - IDE Code

## 📖 Sumário
* [Pré-requisitos](#Pré-requisitos)
* [Instalando](#Instalando)
* [Migrations](#Migrations)
* [Docker](#Docker)
* [Tests](#Tests)
* [Estrutura de código](#Padronização-de-codigo)

# 🚀 Começando

Essas instruções permitirão que você obtenha uma cópia do projeto em operação na sua máquina local para fins de desenvolvimento e teste.

# 📋 Pré-requisitos

* docker
* docker-compose
* npm
* git
* VSCode

# 🔧 Instalando

Clonar o repositório
```
git clone https://github.com/vitorbgouveia/robo-bb.git
```

Acessar diretório raiz ps-exemplo-api e executar:
```
npm i
```

# 📦 Docker

Docker é um conjunto de produtos de plataforma como serviço que usam virtualização de nível de sistema operacional para entregar software em pacotes chamados contêineres.
 Os contêineres são isolados uns dos outros e agrupam seus próprios softwares, bibliotecas e arquivos de configuração.

Levantar container `docker-compose up`

Abrir no navegador `http://localhost:5000`


Para levantar o container:
```
docker-compose up -d --b
```