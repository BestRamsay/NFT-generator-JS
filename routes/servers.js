import { Router } from "express";
import  {getTraitsServer, getTitleServer, setTraitServer, nftGenerate} from '../controllers/servers.js'
const router = Router()

router.get('/api/traits', getTraitsServer)
router.get('/api/title', getTitleServer)
router.post('/api/traits', setTraitServer)
router.post('/api/nft', nftGenerate)
// router.delete('/api/server/:id', remove) 

// router.put() // полностью обновлять элемент
// router.patch() // частично обновлять элемент

export default router; 