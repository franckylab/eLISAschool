--
-- PostgreSQL database dump
--

\restrict 8MiD0nNFRVki7zKheOiWb5xCoIbGS9hNPg1BGptaaH8NE2339iUN3GjSIV55KKU

-- Dumped from database version 16.14
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: identites; Type: TABLE; Schema: public; Owner: elisaschool_user
--

CREATE TABLE public.identites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    "emailVerifie" boolean DEFAULT false NOT NULL,
    "motDePasseHash" character varying(255),
    "mfaActive" boolean DEFAULT false NOT NULL,
    "mfaSecret" character varying(255),
    "derniereConnexion" timestamp without time zone,
    statut character varying(20) DEFAULT 'ACTIF'::character varying NOT NULL
);


ALTER TABLE public.identites OWNER TO elisaschool_user;

--
-- Name: memberships; Type: TABLE; Schema: public; Owner: elisaschool_user
--

CREATE TABLE public.memberships (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "identiteId" uuid NOT NULL,
    "contexteType" character varying(20) NOT NULL,
    "contexteId" uuid,
    role character varying(50) NOT NULL,
    "permissionsCustom" jsonb,
    "estActif" boolean DEFAULT true NOT NULL,
    "dateActivation" timestamp without time zone DEFAULT now() NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.memberships OWNER TO elisaschool_user;

--
-- Name: mfa_configs; Type: TABLE; Schema: public; Owner: elisaschool_user
--

CREATE TABLE public.mfa_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "secretHash" character varying(255) NOT NULL,
    "backupCodesHash" text NOT NULL,
    actif boolean DEFAULT false NOT NULL,
    "derniereVerification" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mfa_configs OWNER TO elisaschool_user;

--
-- Name: permissions_plateforme; Type: TABLE; Schema: public; Owner: elisaschool_user
--

CREATE TABLE public.permissions_plateforme (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(100) NOT NULL,
    libelle character varying(200) NOT NULL,
    module character varying(50) NOT NULL,
    description text,
    "estSysteme" boolean DEFAULT true NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions_plateforme OWNER TO elisaschool_user;

--
-- Name: sessions_plateforme; Type: TABLE; Schema: public; Owner: elisaschool_user
--

CREATE TABLE public.sessions_plateforme (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurPlateformeId" uuid NOT NULL,
    token character varying(500) NOT NULL,
    ip character varying(45),
    "userAgent" text,
    "expiresAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions_plateforme OWNER TO elisaschool_user;

--
-- Name: utilisateurs_plateforme; Type: TABLE; Schema: public; Owner: elisaschool_user
--

CREATE TABLE public.utilisateurs_plateforme (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "identiteId" uuid NOT NULL,
    "rolePlateforme" character varying(30) DEFAULT 'SUPPORT'::character varying NOT NULL,
    prenom character varying(100),
    nom character varying(100),
    "avatarUrl" character varying(500),
    "dernierAcces" timestamp without time zone,
    "estActif" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.utilisateurs_plateforme OWNER TO elisaschool_user;

--
-- Name: sessions_plateforme PK_1dd2d7efad22fd5d1d139ad875f; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.sessions_plateforme
    ADD CONSTRAINT "PK_1dd2d7efad22fd5d1d139ad875f" PRIMARY KEY (id);


--
-- Name: memberships PK_25d28bd932097a9e90495ede7b4; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY (id);


--
-- Name: permissions_plateforme PK_28fbc9255e733957b9e077a6fb5; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.permissions_plateforme
    ADD CONSTRAINT "PK_28fbc9255e733957b9e077a6fb5" PRIMARY KEY (id);


--
-- Name: mfa_configs PK_58d0a5bee911a33f64f0764e159; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.mfa_configs
    ADD CONSTRAINT "PK_58d0a5bee911a33f64f0764e159" PRIMARY KEY (id);


--
-- Name: identites PK_65e55dffd986ffe2f21e1d8e9ae; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.identites
    ADD CONSTRAINT "PK_65e55dffd986ffe2f21e1d8e9ae" PRIMARY KEY (id);


--
-- Name: utilisateurs_plateforme PK_98335df0363b0eaddbd6b491527; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.utilisateurs_plateforme
    ADD CONSTRAINT "PK_98335df0363b0eaddbd6b491527" PRIMARY KEY (id);


--
-- Name: permissions_plateforme UQ_2a41a2e694bd8c58e9de4090e9c; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.permissions_plateforme
    ADD CONSTRAINT "UQ_2a41a2e694bd8c58e9de4090e9c" UNIQUE (code);


--
-- Name: sessions_plateforme UQ_748dd1761daf3e58b8cfdcf3a41; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.sessions_plateforme
    ADD CONSTRAINT "UQ_748dd1761daf3e58b8cfdcf3a41" UNIQUE (token);


--
-- Name: utilisateurs_plateforme UQ_933830eb611015f0b5f95e8b434; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.utilisateurs_plateforme
    ADD CONSTRAINT "UQ_933830eb611015f0b5f95e8b434" UNIQUE ("identiteId");


--
-- Name: mfa_configs UQ_bc4a04626c287efedb090b1f67f; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.mfa_configs
    ADD CONSTRAINT "UQ_bc4a04626c287efedb090b1f67f" UNIQUE ("utilisateurId");


--
-- Name: identites UQ_f04392b0e1c1395ea58032b562d; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.identites
    ADD CONSTRAINT "UQ_f04392b0e1c1395ea58032b562d" UNIQUE (email);


--
-- Name: memberships uq_membership_identite_contexte; Type: CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT uq_membership_identite_contexte UNIQUE ("identiteId", "contexteType", "contexteId");


--
-- Name: IDX_07ab13447f3115c114a0c45769; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_07ab13447f3115c114a0c45769" ON public.memberships USING btree (role);


--
-- Name: IDX_2a41a2e694bd8c58e9de4090e9; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_2a41a2e694bd8c58e9de4090e9" ON public.permissions_plateforme USING btree (code);


--
-- Name: IDX_4dfb64d5c158e486b52e3b9f96; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_4dfb64d5c158e486b52e3b9f96" ON public.permissions_plateforme USING btree (ordre);


--
-- Name: IDX_553c506fd7263f3ef3c70e54f7; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_553c506fd7263f3ef3c70e54f7" ON public.permissions_plateforme USING btree (module);


--
-- Name: IDX_748dd1761daf3e58b8cfdcf3a4; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE UNIQUE INDEX "IDX_748dd1761daf3e58b8cfdcf3a4" ON public.sessions_plateforme USING btree (token);


--
-- Name: IDX_77c4483b4d60041ff242668a2a; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_77c4483b4d60041ff242668a2a" ON public.sessions_plateforme USING btree ("expiresAt");


--
-- Name: IDX_81500e7da364b9d5d40cd0e1ad; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_81500e7da364b9d5d40cd0e1ad" ON public.utilisateurs_plateforme USING btree ("estActif");


--
-- Name: IDX_933830eb611015f0b5f95e8b43; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_933830eb611015f0b5f95e8b43" ON public.utilisateurs_plateforme USING btree ("identiteId");


--
-- Name: IDX_9c95b4fdca7a4b5efe757eb85c; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_9c95b4fdca7a4b5efe757eb85c" ON public.memberships USING btree ("contexteId");


--
-- Name: IDX_bc4a04626c287efedb090b1f67; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE UNIQUE INDEX "IDX_bc4a04626c287efedb090b1f67" ON public.mfa_configs USING btree ("utilisateurId");


--
-- Name: IDX_d86473fabfea8aa95945c4a94d; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_d86473fabfea8aa95945c4a94d" ON public.memberships USING btree ("identiteId");


--
-- Name: IDX_d86d7ffeae9b11624c1bb2253d; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_d86d7ffeae9b11624c1bb2253d" ON public.identites USING btree (statut);


--
-- Name: IDX_d91a7dfa5650e3afe9d2329df0; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_d91a7dfa5650e3afe9d2329df0" ON public.memberships USING btree ("contexteType");


--
-- Name: IDX_f04392b0e1c1395ea58032b562; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_f04392b0e1c1395ea58032b562" ON public.identites USING btree (email);


--
-- Name: IDX_fce1dad371fe2af56e4c65c392; Type: INDEX; Schema: public; Owner: elisaschool_user
--

CREATE INDEX "IDX_fce1dad371fe2af56e4c65c392" ON public.utilisateurs_plateforme USING btree ("rolePlateforme");


--
-- Name: utilisateurs_plateforme FK_933830eb611015f0b5f95e8b434; Type: FK CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.utilisateurs_plateforme
    ADD CONSTRAINT "FK_933830eb611015f0b5f95e8b434" FOREIGN KEY ("identiteId") REFERENCES public.identites(id) ON DELETE CASCADE;


--
-- Name: sessions_plateforme FK_b5163affc45a840f035cd749288; Type: FK CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.sessions_plateforme
    ADD CONSTRAINT "FK_b5163affc45a840f035cd749288" FOREIGN KEY ("utilisateurPlateformeId") REFERENCES public.utilisateurs_plateforme(id) ON DELETE CASCADE;


--
-- Name: mfa_configs FK_bc4a04626c287efedb090b1f67f; Type: FK CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.mfa_configs
    ADD CONSTRAINT "FK_bc4a04626c287efedb090b1f67f" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: memberships FK_d86473fabfea8aa95945c4a94da; Type: FK CONSTRAINT; Schema: public; Owner: elisaschool_user
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "FK_d86473fabfea8aa95945c4a94da" FOREIGN KEY ("identiteId") REFERENCES public.identites(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 8MiD0nNFRVki7zKheOiWb5xCoIbGS9hNPg1BGptaaH8NE2339iUN3GjSIV55KKU

