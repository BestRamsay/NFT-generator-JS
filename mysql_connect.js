import mysql from "mysql2";
import { setTimeout } from 'timers/promises';

export let traitProbability = {}; // объект внутри которого трейты  с вероятностями trait:[title],[probability]
export let traits;
export let conflicts;
export let unconditionalMatches;
let titleProbability;
// TODO:добавить проверки!!!!!!!!!!!!!!!!!
const getTraitProbability = async () => { // на вход должен получать фильтр для таблиц
    try {
        const createConnection = () => {
            return mysql.createConnection({
                host: "database-2.clua1x1ptzge.us-east-1.rds.amazonaws.com", //тут будет другой адрес: 127.0.0.1
                user: "admin",
                database: "rts_mysql_base",
                password: "11111111"
            });
        };
    
        const connection = await createConnection();
        connection.connect( function(err){
            if (err) {
                return console.error("Error: " + err.message);
            }
            else{
                console.log("Connect successfully");
                
                const queryTraitTypes = "SELECT * FROM traittypes";
                connection.query(queryTraitTypes, function (err, result) {
                    if (err) throw err;
                    traits = result;
                    //console.log(traits);
                });
                
                const queryTitleProb = "SELECT * FROM traits";
                connection.query(queryTitleProb, function(err, result) {
                    if (err) throw err;
                    titleProbability = result;
                    //console.log(titleProbability);
                });
    
                const queryConflicts = "SELECT * FROM conflicts";
                connection.query(queryConflicts, function(err, result) {
                    if (err) throw err;
                    conflicts = result;
                    //console.log(conflicts);
                });
    
                const queryUnconditionalMatches = "SELECT * FROM unconditional_matches";
                connection.query(queryUnconditionalMatches, function(err, result){
                    if (err) throw err;
                    unconditionalMatches = result; 
                });
    
            }
        });
        const result = await setTimeout(2000, ''); 
    
        connection.end(function(err) {
            if (err) {
                return console.log("Error: " + err.message);
            }
            console.log("Connection is closed");
          });
    } catch (error) {
        console.log(error);
    }
    
}

export const getConflicts = () =>{ // счет в титлах идет с нуля , поэтому -1
    let computeConflicts = [];

    for (let index = 0; index  < conflicts.length; index++) { // {trait_1: title, trait_2: title, replace: trait_substitute }
        const trait_1 = traits[titleProbability[conflicts[index]['trait_1_id']-1]['traittype_id']-1]['title'];
        const trait_2 = traits[titleProbability[conflicts[index]['trait_2_id']-1]['traittype_id']-1]['title'];
        computeConflicts[index] = {[trait_1] : titleProbability[conflicts[index]['trait_1_id']-1]['title'],
                                   [trait_2]: titleProbability[conflicts[index]['trait_2_id']-1]['title'],
                                   'replace': conflicts[index]['trait_substitute']}
        
    }
    return computeConflicts;
}

export const getUnconditionalMatches = () =>{ // счет в титлах идет с нуля , поэтому -1
    let computeUnconditionalMatches = [];

    for (let index = 0; index  < unconditionalMatches.length; index++) { // {trait_1: title, trait_2: title }.

        const trait = traits[titleProbability[unconditionalMatches[index]['trait_id']-1]['traittype_id']-1]['title'];
        const match = traits[titleProbability[unconditionalMatches[index]['match_trait_id']-1]['traittype_id']-1]['title'];
        computeUnconditionalMatches[index] = {[trait]: titleProbability[unconditionalMatches[index]['trait_id']-1]['title'],
                                              [match]: titleProbability[unconditionalMatches[index]['match_trait_id']-1]['title']}
        
    }
    return computeUnconditionalMatches;
}


export const requestData = async () => {
    try {
        await getTraitProbability(); // проверят состояние
        const result = await setTimeout(2000, ''); 

        for (let i = 0; i < traits.length; i += 1){
            traitProbability[traits[i]['title']] = [[],[]]

            for (let j = 0; j< titleProbability.length; j +=1 ) {
                if (traits[i]['id'] === titleProbability[j]['traittype_id']){
                    traitProbability[traits[i]['title']][0].push(titleProbability[j]['title']);
                    traitProbability[traits[i]['title']][1].push(titleProbability[j]['probability']);
                }
            }
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
    
}

export const getProbability = () => {
    return traitProbability;
} 

export const getTraitTitles = () => {
    return traits;
}

export const createTables = async() => {
    try {
        const createConnection = () => {
            return mysql.createConnection({
                host: "database-2.clua1x1ptzge.us-east-1.rds.amazonaws.com",
                user: "admin",
                database: "rts_mysql_base",
                password: "11111111"
            });
        };
    
        const connection = await createConnection();
    
        //здесь должны быть ${} с именами INDEX, и таблиц
        const queryCreateTraitTypes = `CREATE TABLE if not exists traittypes ( 
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT, 
            title VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci', 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
            PRIMARY KEY (id) USING BTREE 
        ) 
        COLLATE='utf8_general_ci' 
        ENGINE=InnoDB 
        ;`; 
        connection.query(queryCreateTraitTypes, function(err, results) {
            if(err) console.log(err);
            else console.log("Таблица создана traittypes");
        });
    
        //здесь должны быть ${} с именами INDEX, и таблиц
        const queryCreateTraitsTitle = `CREATE TABLE  if not exists traits ( 
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT, 
            traittype_id BIGINT(20) UNSIGNED NULL DEFAULT NULL, 
            title VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci', 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            probability BIGINT(20) UNSIGNED NOT NULL, 
            PRIMARY KEY (id) USING BTREE, 
            INDEX FK_traits_traittypes (traittype_id) USING BTREE, 
            CONSTRAINT FK_traits_traittypes FOREIGN KEY (traittype_id) REFERENCES rts_mysql_base.traittypes (id) ON UPDATE SET NULL ON DELETE SET NULL
            ) 
        COLLATE='utf8_general_ci' 
        ENGINE=InnoDB 
        ;`;
        connection.query(queryCreateTraitsTitle, function(err, results) {
            if(err) console.log(err);
            else console.log("Таблица создана traits");
        });
    
        //здесь должны быть ${} с именами INDEX, и таблиц
        const queryCreateConflicts = `CREATE TABLE if not exists  conflicts (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            trait_1_id BIGINT(20) UNSIGNED NULL DEFAULT NULL,
            trait_2_id BIGINT(20) UNSIGNED NULL DEFAULT NULL,
            trait_substitute BIGINT(19) NOT NULL DEFAULT '0',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id) USING BTREE,
            INDEX FK_conflicts_traits_2 (trait_2_id) USING BTREE,
            INDEX FK_conflicts_traits_1 (trait_1_id) USING BTREE,
            CONSTRAINT FK_conflicts_traits_1 FOREIGN KEY (trait_1_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL,
            CONSTRAINT FK_conflicts_traits_2 FOREIGN KEY (trait_2_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL
        )
        COLLATE='utf8_general_ci'
        ENGINE=InnoDB
        ;`;
        connection.query(queryCreateConflicts, function(err, results) {
            if(err) console.log(err);
            else console.log("Таблица создана conflicts");
        });
    
        //здесь должны быть ${} с именами INDEX, и таблиц
        const queryCreateUnconditionalMatches = `CREATE TABLE if not exists  unconditional_matches (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            trait_id BIGINT(20) UNSIGNED NULL,
            match_trait_id BIGINT(20) UNSIGNED NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id) USING BTREE,
            INDEX FK_match (match_trait_id) USING BTREE,
            INDEX FK_traits (trait_id) USING BTREE,
            CONSTRAINT FK_unconditional_matches_traits_1 FOREIGN KEY (trait_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL,
            CONSTRAINT FK_unconditional_matches_traits_2 FOREIGN KEY (match_trait_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL
        )
        COLLATE='utf8mb4_0900_ai_ci'
        ENGINE=InnoDB
        ;`;
        connection.query(queryCreateUnconditionalMatches, function(err, results) {
            if(err) console.log(err);
            else console.log("Таблица создана unconditional_matches");
        });
    
        //здесь должны быть ${} с именами INDEX, и таблиц
        const queryCreateBundles = `CREATE TABLE if not exists bundles (
            id CHAR(50) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
            path VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
            stats JSON NULL DEFAULT NULL,
            status_id VARCHAR(255) NOT NULL DEFAULT 'pending' COMMENT 'success | failed | pending' COLLATE 'utf8mb4_0900_ai_ci',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id) USING BTREE
        )
        COLLATE='utf8mb4_0900_ai_ci'
        ENGINE=InnoDB
        `;
        connection.query(queryCreateBundles, function(err, results) {
            if(err) console.log(err);
            else console.log("Таблица создана bundles");
        });
    
        connection.end();
    } catch (error) {
        console.log(error);
    }
    
}

export const setValues = async (table, сolumns, values) => {
    try {
        const createConnection = () => {
            return mysql.createConnection({
                host: "database-2.clua1x1ptzge.us-east-1.rds.amazonaws.com",
                user: "admin",
                database: "rts_mysql_base",
                password: "11111111"
            });
        };
    
        const connection = await createConnection();
    
        let allColumns = сolumns.join();
        let allValues = values.join();
    
        const querySet = `INSERT INTO ${table}(${allColumns}) VALUES(${allValues})`;
        connection.query(querySet, function(err, results) {
            if(err) {
                console.log(err);
                //connection.end();
                return false;
            }
            console.log(results);
   
        });   
    
        connection.end();
        return true;
    } catch (error) {
        console.log(error);
        connection.end();
        return false;
    }

}