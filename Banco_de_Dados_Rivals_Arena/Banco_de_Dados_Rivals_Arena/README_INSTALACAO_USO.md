# Rivals Arena — Arquivos Adicionais

Nesta pasta estão os arquivos necessários para configurar e utilizar o banco de dados do projeto Rivals Arena. Também estão incluídas as instruções para fazer a instalação e executar o sistema.

## Conteúdo da pasta

- `01_criar_banco_tabelas.sql` — arquivo responsável pela criação do banco de dados `rivals_arena_front` e de todas as suas tabelas.
- `02_inserir_dados.sql` — arquivo com os dados de demonstração, como times, usuários, campeonatos, partidas, inscrições e publicações.
- `README_INSTALACAO_USO.md` — arquivo com as instruções para configurar, instalar e utilizar o projeto.

## Requisitos

Para utilizar o projeto, é necessário ter:

- MySQL Server instalado.
- MySQL Workbench ou outro programa para acessar o banco de dados.
- Os arquivos do projeto Rivals Arena.

## 1. Configuração do MySQL

1. Primeiro, é necessário instalar e iniciar o MySQL Server.
2. Depois, abra o MySQL Workbench e conecte-se ao banco de dados.
3. Confira as informações de conexão, como usuário, senha, host e porta.
4. Abra o arquivo `01_criar_banco_tabelas.sql`.
5. Execute o script para criar o banco `rivals_arena_front` e suas respectivas tabelas.

**Importante:** o script apaga as tabelas que já existem com esses nomes antes de criá-las novamente. Por isso, caso existam dados importantes, é necessário fazer um backup antes de executar.

## 2. Inserção dos dados

Depois de criar o banco e as tabelas, é necessário inserir os dados de demonstração.

1. Abra o arquivo `02_inserir_dados.sql` no MySQL Workbench.
2. Execute o script para adicionar os dados ao banco.
3. Atualize a lista de bancos de dados e confira se as tabelas foram criadas e preenchidas corretamente.

Foram cadastrados alguns usuários para facilitar os testes do sistema:

| Nick   | E-mail          | Senha |

| Kairo  | kairo@demo.com  | demo1234 |
| Lume   | lume@demo.com   | demo1234 |
| Brisa  | brisa@demo.com  | demo1234 |
| Vexa   | vexa@demo.com   | demo1234 |

As senhas já estão armazenadas no banco em formato criptografado (hash). Para acessar o sistema, basta utilizar a senha de demonstração indicada acima, caso o login esteja configurado para essas contas.

## 3. Configuração do sistema

Para conectar o sistema ao banco de dados, é necessário configurar as informações de acesso ao MySQL.

Caso o projeto tenha um arquivo `.env`, por exemplo, ele deve conter as informações de conexão, como:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rivals_arena_front
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
```

Os dados devem ser preenchidos de acordo com as configurações do MySQL instalado no computador.

## 4. Instalação e execução

Para executar o projeto, siga os passos:

1. Abra a pasta do projeto no Visual Studio Code ou em outro editor de código.
2. Instale as dependências necessárias, de acordo com as tecnologias utilizadas.
3. Configure a conexão com o banco de dados.
4. Inicie o backend, caso exista, utilizando o comando configurado no projeto.
5. Inicie o frontend para abrir a aplicação.
6. Depois que o sistema estiver em execução, acesse o endereço indicado pelo servidor no navegador.

Os comandos utilizados para iniciar o projeto podem variar de acordo com sua configuração. Por isso, é importante conferir os arquivos do projeto antes de executar.

## 5. Como utilizar o sistema

Com o sistema aberto no navegador, o usuário poderá acessar as funcionalidades disponíveis na plataforma.

Entre as principais áreas do Rivals Arena estão:

- **Jogos:** visualizar os jogos disponíveis na plataforma.
- **Times:** consultar as equipes cadastradas.
- **Campeonatos:** visualizar os campeonatos e suas informações.
- **Partidas:** acompanhar os confrontos e resultados.
- **Publicações:** visualizar as publicações feitas pelos usuários.

Também é possível utilizar as contas de demonstração para testar o acesso ao sistema, caso o login esteja disponível.

## 6. Verificação do banco de dados

Para conferir se o banco foi criado corretamente e se os dados foram inseridos, basta executar os comandos abaixo no MySQL Workbench:

```sql
USE rivals_arena_front;

SHOW TABLES;

SELECT * FROM Times;
SELECT * FROM Usuarios;
SELECT * FROM Campeonatos;
SELECT * FROM Inscricaos;
SELECT * FROM Partidas;
SELECT * FROM Publicacaos;
SELECT * FROM Jogos;
```

Esses comandos mostram as tabelas existentes e os registros cadastrados em cada uma delas.

## 7. Observações finais

- Primeiro deve ser executado o arquivo de criação do banco e das tabelas e, depois, o arquivo de inserção dos dados.
- O script de criação recria as tabelas, apagando os dados anteriores.
- O script de inserção deve ser executado apenas uma vez para evitar registros duplicados.
- Os dados inseridos são exemplos utilizados para demonstrar o funcionamento do sistema.
- As tabelas possuem relacionamentos entre si por meio das chaves estrangeiras, permitindo conectar usuários, times, campeonatos, inscrições, partidas e publicações.

Com esses arquivos, é possível preparar o banco de dados e ter os dados necessários para testar as funcionalidades do Rivals Arena.