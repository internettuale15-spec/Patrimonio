-- ============================================================
-- SEED CATEGORIE DI DEFAULT
-- Da eseguire una volta per ogni household (sostituire :household_id)
-- ============================================================

-- ENTRATE
insert into categories (household_id, kind, name, icon, is_default) values
  (:'household_id', 'entrata', 'Stipendio Mirco', 'Briefcase', true),
  (:'household_id', 'entrata', 'Stipendio Debora', 'Briefcase', true),
  (:'household_id', 'entrata', 'Assegno Unico', 'Baby', true),
  (:'household_id', 'entrata', 'Bonus', 'Gift', true),
  (:'household_id', 'entrata', 'Rimborsi', 'Undo2', true),
  (:'household_id', 'entrata', 'Interessi', 'Percent', true),
  (:'household_id', 'entrata', 'Dividendi', 'TrendingUp', true),
  (:'household_id', 'entrata', 'Vendite', 'Tag', true),
  (:'household_id', 'entrata', 'Altre Entrate', 'Plus', true);

-- SPESE FISSE
insert into categories (household_id, kind, name, icon, is_default) values
  (:'household_id', 'spesa_fissa', 'Mutuo', 'Home', true),
  (:'household_id', 'spesa_fissa', 'Affitto', 'Building', true),
  (:'household_id', 'spesa_fissa', 'Luce', 'Zap', true),
  (:'household_id', 'spesa_fissa', 'Gas', 'Flame', true),
  (:'household_id', 'spesa_fissa', 'Acqua', 'Droplet', true),
  (:'household_id', 'spesa_fissa', 'Internet', 'Wifi', true),
  (:'household_id', 'spesa_fissa', 'Telefoni', 'Phone', true),
  (:'household_id', 'spesa_fissa', 'Netflix', 'Tv', true),
  (:'household_id', 'spesa_fissa', 'Prime', 'Package', true),
  (:'household_id', 'spesa_fissa', 'Assicurazioni', 'Shield', true),
  (:'household_id', 'spesa_fissa', 'Abbonamenti', 'RefreshCcw', true);

-- SPESE VARIABILI (include "Casa" come categoria target del trigger home_expenses)
insert into categories (household_id, kind, name, icon, is_default) values
  (:'household_id', 'spesa_variabile', 'Spesa', 'ShoppingCart', true),
  (:'household_id', 'spesa_variabile', 'Benzina', 'Fuel', true),
  (:'household_id', 'spesa_variabile', 'Ristoranti', 'UtensilsCrossed', true),
  (:'household_id', 'spesa_variabile', 'Farmacia', 'Pill', true),
  (:'household_id', 'spesa_variabile', 'Vestiti', 'Shirt', true),
  (:'household_id', 'spesa_variabile', 'Amazon', 'Package2', true),
  (:'household_id', 'spesa_variabile', 'Bambini', 'Baby', true),
  (:'household_id', 'spesa_variabile', 'Animali', 'PawPrint', true),
  (:'household_id', 'spesa_variabile', 'Tempo Libero', 'Gamepad2', true),
  (:'household_id', 'spesa_variabile', 'Regali', 'Gift', true),
  (:'household_id', 'spesa_variabile', 'Casa', 'Home', true),
  (:'household_id', 'spesa_variabile', 'Altro', 'MoreHorizontal', true);

-- CASA (sottocategorie dedicate alla sezione Casa — generano righe in "spesa_variabile > Casa")
insert into categories (household_id, kind, name, icon, is_default) values
  (:'household_id', 'casa', 'Mobili', 'Sofa', true),
  (:'household_id', 'casa', 'Elettrodomestici', 'WashingMachine', true),
  (:'household_id', 'casa', 'Manutenzione', 'Wrench', true),
  (:'household_id', 'casa', 'Condominio', 'Building2', true),
  (:'household_id', 'casa', 'Ristrutturazioni', 'Hammer', true),
  (:'household_id', 'casa', 'Tasse', 'Receipt', true),
  (:'household_id', 'casa', 'Arredo', 'Armchair', true);
