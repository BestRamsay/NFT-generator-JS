import { Router } from "express";
import * as server from '../controllers/servers.js';
const router = Router()

router.get('/api/traittypes', server.getTraitTypesServer)
router.get('/api/traits', server.getTraitsServer)
router.get('/api/conflicts', server.getConflictsServer)
router.get('/api/unconditionalMatch', server.getUnconditionalMatchServer)
router.post('/api/bundle', server.getBundleServer)
router.post('/api/traittypes', server.setTraitTypesServer)
router.post('/api/traits', server.setTraitsServer)
router.post('/api/conflicts', server.setConflictsServer)
router.post('/api/unconditionalMatch', server.setNewUnconditionalMatchServer)
router.post('/upload', server.uploadManyImagesServer)
router.post('/api/nft', server.nftGenerate)

// router.delete('/api/server/:id', remove) 

// router.put() // полностью обновлять элемент
// router.patch() // частично обновлять элемент

export default router; 