VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form ModificaTarifa 
   BackColor       =   &H80000007&
   Caption         =   "Modifica Tarifa"
   ClientHeight    =   5010
   ClientLeft      =   60
   ClientTop       =   420
   ClientWidth     =   12945
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5010
   ScaleWidth      =   12945
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2760
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   240
      Width           =   4455
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1800
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   240
      Width           =   855
   End
   Begin VB.Frame ViajesPend 
      BackColor       =   &H80000007&
      Caption         =   "Viajes Pendientes"
      ForeColor       =   &H000040C0&
      Height          =   3975
      Left            =   120
      TabIndex        =   3
      Top             =   840
      Width           =   12615
      Begin MSComctlLib.ListView ListaViajes 
         Height          =   3495
         Left            =   120
         TabIndex        =   4
         Top             =   240
         Width           =   12195
         _ExtentX        =   21511
         _ExtentY        =   6165
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   16
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Rem"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Chofer"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Mercaderia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Procedencia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Destino"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Kilos"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "SubTotal"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   9
            Text            =   "CodFlet"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   10
            Text            =   "Fletero"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   11
            Text            =   "CodEmpresa"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   12
            Text            =   "CodChofer"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(14) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   13
            Text            =   "NroViaje"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(15) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   14
            Text            =   "Liq"
            Object.Width           =   176
         EndProperty
         BeginProperty ColumnHeader(16) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   15
            Text            =   "Facturado"
            Object.Width           =   176
         EndProperty
      End
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Empresa"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Left            =   240
      TabIndex        =   2
      Top             =   240
      Width           =   1455
   End
End
Attribute VB_Name = "ModificaTarifa"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Form_Load()
Text1(0) = "": Text1(1) = ""
End Sub

Private Sub ListaViajes_DblClick()
Dim LViajes As ListItem
Dim ret As VbMsgBoxResult
On Error Resume Next
With ConsultaViajes
    .Show
    .Height = 5505
    .Width = 5505
    .Top = (Screen.Height - .Height) / 2 - 600
    .Left = (Screen.Width - .Width) / 2
    Set Lista = ListaViajes.ListItems.Item(ListaViajes.SelectedItem.Index)
    .Text1(1) = Lista.Tag: .Text1(8) = Lista.SubItems(1): .Text1(7) = Lista.SubItems(2)
    .Text1(9) = Lista.SubItems(3): .Text1(10) = Lista.SubItems(4): .Text1(11) = Lista.SubItems(5)
    .Text1(12) = Lista.SubItems(6): .Text1(13) = Lista.SubItems(7): .Text1(14) = Lista.SubItems(8)
    .Text1(4) = Lista.SubItems(9): .Text1(5) = Lista.SubItems(10)
    .Text1(2) = Lista.SubItems(11): .Text1(6) = Lista.SubItems(12)
    .Text1(16) = Lista.SubItems(13)
    .Text1(0) = Lista.SubItems(14)
    .Text1(15) = Lista.SubItems(15)
    Set rsempresa = db.OpenRecordset("Select * from Empresas Where CodEmpresas = " & Lista.SubItems(11) & "")
    .Text1(3) = rsEmpresas!DescEmpresas
    ConsNroViaje = Lista.SubItems(13)
End With
End Sub

Private Sub Text1_LostFocus(Index As Integer)
On Error Resume Next
Select Case Index
Case 0:
    If Not Text1(0) = "" Then
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(0) & "")
        If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
            Text1(1) = rsEmpresas!DescEmpresas
                Set rsViajesFact = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE CodEmpresa = " & Text1(0) & " ORDER BY Fecha")
                If Not rsViajesFact.EOF And Not rsViajesFact.BOF Then
                    ListaViajes.ListItems.Clear
                    Do While Not rsViajesFact.EOF
                        Set Lista = ListaViajes.ListItems.Add(, , rsViajesFact!Fecha)
                        Lista.Tag = rsViajesFact!Fecha
                        Lista.SubItems(1) = rsViajesFact!NroRemito
                        Lista.SubItems(2) = rsViajesFact!DescChofer
                        Lista.SubItems(3) = rsViajesFact!mERCADERIA
                        Lista.SubItems(4) = rsViajesFact!pROCEDENCIA
                        Lista.SubItems(5) = rsViajesFact!dESTINO
                        Lista.SubItems(6) = FormatNumber(rsViajesFact!kilos)
                        Lista.SubItems(7) = FormatNumber(rsViajesFact!tarifa)
                        Lista.SubItems(8) = FormatNumber(rsViajesFact!sUBTOTAL)
                        Lista.SubItems(9) = rsViajesFact!codflet
                        If Not rsViajesFact!codflet = "" Then
                            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsViajesFact!codflet & "")
                        End If
                        Lista.SubItems(10) = rsFleteros!DescFlet
                        Set rsFleteros = Nothing
                        Lista.SubItems(11) = rsViajesFact!CodEmpresa
                        Lista.SubItems(12) = rsViajesFact!CodChofer
                        Lista.SubItems(13) = rsViajesFact!NroViaje
                        Lista.SubItems(14) = rsViajesFact!NroLiq
                        Lista.SubItems(15) = rsViajesFact!Facturado
                        rsViajesFact.MoveNext
                    Loop
                Else
                    MsgBox "No Hay Viajes para Facturar", vbInformation
                End If
            Set rsViajesFact = Nothing
        End If
    End If
End Select

End Sub
