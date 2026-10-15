import { Router } from 'express'
import anthropic from './anthropic.js'

const router = Router()

router.use('/anthropic', anthropic)

export default router
